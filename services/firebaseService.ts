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

import {
  Student,
  Lecturer,
  UserProfile,
  PracticeSession,
  MeetingSession,
  MinuteTakingSession,
  ComplaintSession,
  ComplaintEmailSession
} from '../types';

// --- AUTHENTICATION ---

export const signUpStudent = async (
  details: { email: string; courseCode: string; classCode: string },
  password: string
) => {

  // Search lecturer by classCode
  const lecturersRef = collection(db, 'users');
  const q = query(
    lecturersRef,
    where('role', '==', 'lecturer'),
    where('classCodes', 'array-contains', details.classCode.toUpperCase())
  );
  
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error(
      `Registration failed: Class ID "${details.classCode.toUpperCase()}" was not found. Please verify it.`
    );
  }

  // Additional match: verify courseCode matches lecturer stored data
  const matchingLecturerDoc = querySnapshot.docs.find(doc => {
    const lecturer = doc.data() as Lecturer;
    return lecturer.courseCode.toUpperCase() === details.courseCode.toUpperCase();
  });

  if (!matchingLecturerDoc) {
    throw new Error(
      `Class code found, but it does NOT match Course Code "${details.courseCode.toUpperCase()}".`
    );
  }

  const matchingLecturer = matchingLecturerDoc.data() as Lecturer;

  // Create Firebase Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  // Create student record in Firestore using NEW naming
  const newStudent: Student = {
    uid: user.uid,
    email: details.email,
    role: 'student',
    courseCode: details.courseCode.toUpperCase(),
    classCode: details.classCode.toUpperCase(),
    lecturerEmail: matchingLecturer.email
  };

  await setDoc(doc(db, 'users', user.uid), newStudent);

  return newStudent;
};


export const signUpLecturer = async (details: Omit<Lecturer, 'uid' | 'role'>, password: string) => {

  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  const upperClassCodes = details.classCodes.map(c => c.toUpperCase().trim()).filter(Boolean);

  const newLecturer: Lecturer = {
    ...details,
    uid: user.uid,
    role: 'lecturer',
    classCodes: upperClassCodes,
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


// --- ERROR HANDLING ---

export const formatAuthError = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    default:
      return error.message || 'Authentication failed.';
  }
};


// --- USER PROFILE ---

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
  return updateDoc(doc(db, 'users', uid), data);
};

export const getUsersForLecturer = async (lecturerEmail: string): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');

  const studentQuery = query(usersRef, where('role', '==', 'student'), where('lecturerEmail', '==', lecturerEmail));
  const lecturerQuery = query(usersRef, where('role', '==', 'lecturer'), where('email', '==', lecturerEmail));

  const [studentSnapshot, lecturerSnapshot] = await Promise.all([
    getDocs(studentQuery),
    getDocs(lecturerQuery),
  ]);

  const students = studentSnapshot.docs.map(doc => doc.data() as Student);
  const lecturers = lecturerSnapshot.docs.map(doc => doc.data() as Lecturer);

  return [...students, ...lecturers].sort((a, b) => a.email.localeCompare(b.email));
};


// --- STORAGE ---

export const uploadRecording = async (blob: Blob, userId: string, sessionId: string): Promise<string> => {
  const extension = blob.type.split('/')[1] || 'webm';
  const storagePath = `recordings/${userId}/${sessionId}.${extension}`;
  const snapshot = await uploadBytes(ref(storage, storagePath), blob);
  return getDownloadURL(snapshot.ref);
};

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });


// --- FIRESTORE DATA HELPERS ---

export const saveSession = async (collectionName: string, id: string, data: object) => {
  await setDoc(doc(db, collectionName, id), data);
};

export const addSession = async (collectionName: string, data: object) => {
  const refCol = collection(db, collectionName);
  const docRef = await addDoc(refCol, data);
  return docRef.id;
};

export const updateSession = async (collectionName: string, id: string, data: object) => {
  await updateDoc(doc(db, collectionName, id), data);
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
  } else {
    q =
      selectedClass === 'ALL'
        ? query(sessionsRef, where('lecturerEmail', '==', user.email), orderBy('timestamp', 'desc'))
        : query(
            sessionsRef,
            where('lecturerEmail', '==', user.email),
            where('classCode', '==', selectedClass),
            orderBy('timestamp', 'desc')
          );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }) as T);
};


// --- PEER REVIEW & EMAIL SESSIONS ---

export const getPeerReviewSessions = async (): Promise<PracticeSession[]> => {
  const sessionsRef = collection(db, 'practiceSessions');
  const q = query(
    sessionsRef,
    where('isSharedForPeerReview', '==', true),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeSession));
};

export const addPeerReviewFeedback = async (sessionId: string, data: object) => {
  const refCol = collection(db, 'practiceSessions', sessionId, 'peerReviews');
  await addDoc(refCol, data);
};


// --- MEETING SESSIONS ---

export const saveMeetingSession = (data: Omit<MeetingSession, 'id'>) => addSession('meetingSessions', data);
export const getMeetingSessions = (u: UserProfile, c = 'ALL') => getSessions<MeetingSession>('meetingSessions', u, c);
export const saveMeetingLecturerFeedback = (id: string, grade: number, feedback: string) =>
  updateSession('meetingSessions', id, { grade, lecturerFeedback: feedback, isGraded: true });


// --- MINUTE TAKING SESSIONS ---

export const saveMinuteTakingSession = (data: Omit<MinuteTakingSession, 'id'>) =>
  addSession('minuteTakingSessions', data);
export const getMinuteTakingSessions = (u: UserProfile, c = 'ALL') =>
  getSessions<MinuteTakingSession>('minuteTakingSessions', u, c);
export const saveMinuteTakingLecturerFeedback = (id: string, grade: number, fb: string) =>
  updateSession('minuteTakingSessions', id, { grade, lecturerFeedback: fb, isGraded: true });


// --- COMPLAINT HANDLING SESSIONS ---

export const saveComplaintSession = (data: Omit<ComplaintSession, 'id'>) =>
  addSession('complaintSessions', data);
export const getComplaintSessions = (u: UserProfile, c = 'ALL') =>
  getSessions<ComplaintSession>('complaintSessions', u, c);


export const saveComplaintEmailSession = (data: Omit<ComplaintEmailSession, 'id'>) =>
  addSession('complaintEmailSessions', data);
export const getComplaintEmailSessions = (u: UserProfile, c = 'ALL') =>
  getSessions<ComplaintEmailSession>('complaintEmailSessions', u, c);

export const submitComplaintEmailForGrading = (id: string) =>
  updateSession('complaintEmailSessions', id, { isSubmitted: true });

export const saveComplaintEmailLecturerFeedback = (id: string, grade: number, fb: string) =>
  updateSession('complaintEmailSessions', id, { grade, lecturerFeedback: fb });

