import firebase from 'firebase/app-compat';
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
  const lecturersRef = db.collection('users');
  const q = lecturersRef
    .where('role', '==', 'lecturer')
    .where('classCodes', 'array-contains', details.classCode.toUpperCase());
  
  const querySnapshot = await q.get();

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
  const userCredential = await auth.createUserWithEmailAndPassword(details.email, password);
  const { user } = userCredential;
  if (!user) {
    throw new Error('User creation failed.');
  }

  // Create student record in Firestore using NEW naming
  const newStudent: Student = {
    uid: user.uid,
    email: details.email,
    role: 'student',
    courseCode: details.courseCode.toUpperCase(),
    classCode: details.classCode.toUpperCase(),
    lecturerEmail: matchingLecturer.email
  };

  await db.collection('users').doc(user.uid).set(newStudent);

  return newStudent;
};


export const signUpLecturer = async (details: Omit<Lecturer, 'uid' | 'role'>, password: string) => {

  const userCredential = await auth.createUserWithEmailAndPassword(details.email, password);
  const { user } = userCredential;
  if (!user) {
    throw new Error('User creation failed.');
  }

  const upperClassCodes = details.classCodes.map(c => c.toUpperCase().trim()).filter(Boolean);

  const newLecturer: Lecturer = {
    ...details,
    uid: user.uid,
    role: 'lecturer',
    classCodes: upperClassCodes,
    courseCode: details.courseCode.toUpperCase(),
  };

  await db.collection('users').doc(user.uid).set(newLecturer);
  return newLecturer;
};

export const signInUser = (email: string, password: string) => {
  return auth.signInWithEmailAndPassword(email, password);
};

export const signOutUser = () => {
  return auth.signOut();
};

export const sendPasswordReset = (email: string) => {
  return auth.sendPasswordResetEmail(email);
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
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.exists ? (userDoc.data() as UserProfile) : null;
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
  return db.collection('users').doc(uid).update(data);
};

export const getUsersForLecturer = async (lecturerEmail: string): Promise<UserProfile[]> => {
  const usersRef = db.collection('users');

  const studentQuery = usersRef.where('role', '==', 'student').where('lecturerEmail', '==', lecturerEmail);
  const lecturerQuery = usersRef.where('role', '==', 'lecturer').where('email', '==', lecturerEmail);

  const [studentSnapshot, lecturerSnapshot] = await Promise.all([
    studentQuery.get(),
    lecturerQuery.get(),
  ]);

  const students = studentSnapshot.docs.map(doc => doc.data() as Student);
  const lecturers = lecturerSnapshot.docs.map(doc => doc.data() as Lecturer);

  return [...students, ...lecturers].sort((a, b) => a.email.localeCompare(b.email));
};


// --- STORAGE ---

export const uploadRecording = async (blob: Blob, userId: string, sessionId: string): Promise<string> => {
  const extension = blob.type.split('/')[1] || 'webm';
  const storagePath = `recordings/${userId}/${sessionId}.${extension}`;
  const storageRef = storage.ref(storagePath);
  const snapshot = await storageRef.put(blob);
  return snapshot.ref.getDownloadURL();
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
  await db.collection(collectionName).doc(id).set(data);
};

export const addSession = async (collectionName: string, data: object) => {
  const docRef = await db.collection(collectionName).add(data);
  return docRef.id;
};

export const updateSession = async (collectionName: string, id: string, data: object) => {
  await db.collection(collectionName).doc(id).update(data);
};


export const getSessions = async <T extends Record<string, any>>(
  collectionName: string,
  user: UserProfile,
  selectedClass: string = 'ALL'
): Promise<T[]> => {
  const sessionsRef = db.collection(collectionName);
  let q: firebase.firestore.Query;

  if (user.role === 'student') {
    q = sessionsRef.where('studentUid', '==', user.uid).orderBy('timestamp', 'desc');
  } else {
    q =
      selectedClass === 'ALL'
        ? sessionsRef.where('lecturerEmail', '==', user.email).orderBy('timestamp', 'desc')
        : sessionsRef
            .where('lecturerEmail', '==', user.email)
            .where('classCode', '==', selectedClass)
            .orderBy('timestamp', 'desc');
  }

  const snapshot = await q.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }) as T);
};


// --- PEER REVIEW & EMAIL SESSIONS ---

export const getPeerReviewSessions = async (): Promise<PracticeSession[]> => {
  const sessionsRef = db.collection('practiceSessions');
  const q = sessionsRef
    .where('isSharedForPeerReview', '==', true)
    .orderBy('timestamp', 'desc')
    .limit(20);
  const snapshot = await q.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeSession));
};

export const addPeerReviewFeedback = async (sessionId: string, data: object) => {
  await db.collection('practiceSessions').doc(sessionId).collection('peerReviews').add(data);
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
