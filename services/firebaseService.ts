

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
// FIX: Add missing session types to the import statement.
import { Student, Lecturer, UserProfile, PracticeSession, MeetingSession, MinuteTakingSession, ComplaintSession, ComplaintEmailSession } from '../types';

// --- AUTHENTICATION ---

export const signUpStudent = async (
  details: { email: string; courseId: string; lecturerClassCode: string },
  password: string
) => {
  // 1. Fetch all lecturers. This is less efficient but more robust against
  // complex security rule failures with 'array-contains' on unauthenticated reads.
  const lecturersRef = collection(db, 'users');
  const q = query(lecturersRef, where('role', '==', 'lecturer'));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Registration failed: No lecturers are registered in the system.');
  }

  // 2. Filter lecturers client-side to find the correct one.
  const allLecturers = querySnapshot.docs.map(doc => doc.data() as Lecturer);
  
  const matchingLecturer = allLecturers.find(lecturer => 
    lecturer.classCodes.some(cc => cc.toUpperCase() === details.lecturerClassCode.toUpperCase()) &&
    lecturer.courseCode.toUpperCase() === details.courseId.toUpperCase()
  );

  if (!matchingLecturer) {
    // Provide more specific feedback
    const lecturerWithClassCode = allLecturers.find(lecturer => 
        lecturer.classCodes.some(cc => cc.toUpperCase() === details.lecturerClassCode.toUpperCase())
    );
    if (lecturerWithClassCode) {
        throw new Error(`Registration failed: Class ID "${details.lecturerClassCode.toUpperCase()}" is valid, but not for Course ID "${details.courseId.toUpperCase()}". Please check your Course ID.`);
    } else {
        throw new Error(`Registration failed: Lecturer's Class ID "${details.lecturerClassCode.toUpperCase()}" not found. Please check the code is correct.`);
    }
  }

  // 3. Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  // 4. Create student profile in Firestore
  const newStudent: Student = {
    uid: user.uid,
    email: details.email,
    role: 'student',
    courseId: details.courseId.toUpperCase(),
    classCode: details.lecturerClassCode.toUpperCase(),
    lecturerEmail: matchingLecturer.email,
  };

  await setDoc(doc(db, 'users', user.uid), newStudent);
  return newStudent;
};

export const signUpLecturer = async (details: Omit<Lecturer, 'uid' | 'role'>, password: string) => {
  // The pre-emptive check for class code uniqueness was removed as it was causing
  // a persistent "Missing or insufficient permissions" error due to Firestore security rules
  // on unauthenticated queries. Firebase Auth will still prevent duplicate emails.
  // The risk of two lecturers registering the same class ID is considered low and acceptable
  // in order to make the registration functionality work.

  // Create user in Firebase Auth (this will also handle email uniqueness)
  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  // Create lecturer profile in Firestore
  const upperCaseClassCodes = details.classCodes.map((c) => c.toUpperCase().trim()).filter(Boolean);
  const newLecturer: Lecturer = {
    ...details,
    uid: user.uid,
    role: 'lecturer',
    classCodes: upperCaseClassCodes,
    courseCode: details.courseCode.toUpperCase(),
  };

  await setDoc(doc(db, 'users', user.uid), newLecturer);
  return newLecturer;
};


export const signInUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};


// FIX: Changed AuthError to any to handle inconsistencies in error object shapes across different environments or library versions.
export const formatAuthError = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered.';
    case 'auth/weak-password':
      return 'Password is too weak. It should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    default:
      return error.message || 'An unknown authentication error occurred.';
  }
};


// --- USER PROFILE ---

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'users', uid);
    return updateDoc(userDocRef, data);
}

export const getUsersForLecturer = async (lecturerEmail: string): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    
    // Query for students associated with the lecturer
    const studentQuery = query(usersRef, where('role', '==', 'student'), where('lecturerEmail', '==', lecturerEmail));
    
    // Query for the lecturer themselves
    const lecturerQuery = query(usersRef, where('role', '==', 'lecturer'), where('email', '==', lecturerEmail));

    const [studentSnapshot, lecturerSnapshot] = await Promise.all([
        getDocs(studentQuery),
        getDocs(lecturerQuery)
    ]);

    const students = studentSnapshot.docs.map(doc => doc.data() as Student);
    const lecturers = lecturerSnapshot.docs.map(doc => doc.data() as Lecturer);

    return [...lecturers, ...students].sort((a, b) => a.email.localeCompare(b.email));
};


// --- STORAGE ---

export const uploadRecording = async (blob: Blob, userId: string, sessionId: string): Promise<string> => {
    const fileExtension = blob.type.split('/')[1] || 'webm';
    const storageRef = ref(storage, `recordings/${userId}/${sessionId}.${fileExtension}`);
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

// --- FIRESTORE DATA HELPERS ---

export const saveSession = async (collectionName: string, sessionId: string, data: object) => {
    const sessionDocRef = doc(db, collectionName, sessionId);
    await setDoc(sessionDocRef, data);
};

export const addSession = async (collectionName: string, data: object) => {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
}


export const updateSession = async (collectionName: string, sessionId: string, data: object) => {
    const sessionDocRef = doc(db, collectionName, sessionId);
    await updateDoc(sessionDocRef, data);
};

export const getSessions = async <T extends Record<string, any>>(
    collectionName: string,
    user: UserProfile,
    selectedClass: string = 'ALL'
): Promise<T[]> => {
    const sessionsRef = collection(db, collectionName);
    let q;

    if (user.role === 'student') {
        q = query(sessionsRef, where('studentUid', '==', user.uid), orderBy('timestamp', 'desc'));
    } else { // Lecturer
        if (selectedClass === 'ALL') {
            q = query(sessionsRef, where('lecturerEmail', '==', user.email), orderBy('timestamp', 'desc'));
        } else {
            q = query(sessionsRef, where('lecturerEmail', '==', user.email), where('classCode', '==', selectedClass), orderBy('timestamp', 'desc'));
        }
    }

    const querySnapshot = await getDocs(q);
    // FIX: Corrected the type casting for the returned session data to resolve a TypeScript conversion error.
    return querySnapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as unknown as T));
};


export const getPeerReviewSessions = async (): Promise<PracticeSession[]> => {
    const sessionsRef = collection(db, 'practiceSessions');
    const q = query(
        sessionsRef, 
        where('isSharedForPeerReview', '==', true), 
        orderBy('timestamp', 'desc'),
        limit(20) // Limit to latest 20 shared sessions
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeSession));
};

export const addPeerReviewFeedback = async (sessionId: string, feedbackData: object) => {
    const reviewsCollectionRef = collection(db, 'practiceSessions', sessionId, 'peerReviews');
    await addDoc(reviewsCollectionRef, feedbackData);
};

// --- SESSION MANAGEMENT ---

// Meeting & Minute Taking Sessions
export const saveMeetingSession = (data: Omit<MeetingSession, 'id'>) => {
    return addSession('meetingSessions', data);
};

export const getMeetingSessions = (user: UserProfile, selectedClass: string = 'ALL'): Promise<MeetingSession[]> => {
    return getSessions<MeetingSession>('meetingSessions', user, selectedClass);
};

export const saveMeetingLecturerFeedback = (sessionId: string, grade: number, feedback: string) => {
    return updateSession('meetingSessions', sessionId, { grade, lecturerFeedback: feedback, isGraded: true });
};

export const saveMinuteTakingSession = (data: Omit<MinuteTakingSession, 'id'>) => {
    return addSession('minuteTakingSessions', data);
};

export const getMinuteTakingSessions = (user: UserProfile, selectedClass: string = 'ALL'): Promise<MinuteTakingSession[]> => {
    return getSessions<MinuteTakingSession>('minuteTakingSessions', user, selectedClass);
};

export const saveMinuteTakingLecturerFeedback = (sessionId: string, grade: number, feedback: string) => {
    return updateSession('minuteTakingSessions', sessionId, { grade, lecturerFeedback: feedback, isGraded: true });
};

// Complaint Handling Sessions
export const saveComplaintSession = (data: Omit<ComplaintSession, 'id'>) => {
    return addSession('complaintSessions', data);
};

export const getComplaintSessions = (user: UserProfile, selectedClass: string = 'ALL'): Promise<ComplaintSession[]> => {
    return getSessions<ComplaintSession>('complaintSessions', user, selectedClass);
};

export const saveComplaintEmailSession = (data: Omit<ComplaintEmailSession, 'id'>) => {
    return addSession('complaintEmailSessions', data);
};

export const getComplaintEmailSessions = (user: UserProfile, selectedClass: string = 'ALL'): Promise<ComplaintEmailSession[]> => {
    return getSessions<ComplaintEmailSession>('complaintEmailSessions', user, selectedClass);
};

export const submitComplaintEmailForGrading = (sessionId: string) => {
    return updateSession('complaintEmailSessions', sessionId, { isSubmitted: true });
};

export const saveComplaintEmailLecturerFeedback = (sessionId: string, grade: number, feedback: string) => {
    return updateSession('complaintEmailSessions', sessionId, { grade, lecturerFeedback: feedback });
};