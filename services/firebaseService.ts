import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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
import { Student, Lecturer, UserProfile, PracticeSession } from '../types';

// --- AUTHENTICATION ---

export const signUpStudent = async (
  details: { email: string; courseId: string; lecturerClassCode: string },
  password: string
) => {
  // 1. Find the lecturer first
  const lecturersRef = collection(db, 'users');
  const q = query(
    lecturersRef,
    where('role', '==', 'lecturer'),
    where('classCodes', 'array-contains', details.lecturerClassCode.toUpperCase()),
    where('courseCode', '==', details.courseId.toUpperCase())
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error(
      `Registration failed: No lecturer found for Course ID "${details.courseId.toUpperCase()}" and Class ID "${details.lecturerClassCode.toUpperCase()}". Please check the codes are correct.`
    );
  }
  const foundLecturer = querySnapshot.docs[0].data() as Lecturer;

  // 2. Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  // 3. Create student profile in Firestore
  const newStudent: Student = {
    uid: user.uid,
    email: details.email,
    role: 'student',
    courseId: details.courseId.toUpperCase(),
    classCode: details.lecturerClassCode.toUpperCase(),
    lecturerEmail: foundLecturer.email,
  };

  await setDoc(doc(db, 'users', user.uid), newStudent);
  return newStudent;
};

export const signUpLecturer = async (details: Omit<Lecturer, 'uid' | 'role'>, password: string) => {
  // 1. Check if email is already in use
   const lecturersRef = collection(db, 'users');
   const q = query(lecturersRef, where('email', '==', details.email));
   const existingUser = await getDocs(q);
   if (!existingUser.empty) {
       throw new Error("This email is already registered.");
   }

  // 2. Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  // 3. Create lecturer profile in Firestore
  const newLecturer: Lecturer = {
    ...details,
    uid: user.uid,
    role: 'lecturer',
    classCodes: details.classCodes.map(c => c.toUpperCase()),
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

export const getSessions = async <T>(
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
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
