

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
  ComplaintEmailSession,
} from '../types';

/* ---------------------- AUTH (FINAL STABLE VERSION) ---------------------- */

export const signUpStudent = async (
  details: { email: string; courseCode: string; classCode: string },
  password: string
) => {

  const course = details.courseCode.trim().toUpperCase();
  const classCode = details.classCode.trim().toUpperCase();

  const lecturersRef = collection(db, 'users');
  const q = query(
    lecturersRef,
    where('role', '==', 'lecturer'),
    where('courseCode', '==', course)
  );

  const courseSnapshot = await getDocs(q);

  if (courseSnapshot.empty) {
    throw new Error(`Course ID "${course}" does not exist.`);
  }

  let matchedLecturer: Lecturer | null = null;

  courseSnapshot.forEach(docSnap => {
    const data = docSnap.data() as Lecturer;
    if (data.classCodes?.includes(classCode)) matchedLecturer = data;
  });

  if (!matchedLecturer) {
    throw new Error(`Class ID "${classCode}" is not registered under Course "${course}".`);
  }

  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  const newStudent: Student = {
    uid: user.uid,
    email: details.email.trim(),
    role: 'student',
    courseCode: course,
    classCode: classCode,
    lecturerEmail: matchedLecturer.email,
  };

  await setDoc(doc(db, 'users', user.uid), newStudent, { merge: false });

  return newStudent;
};


export const signUpLecturer = async (
  details: Omit<Lecturer, 'uid' | 'role'>,
  password: string
) => {

  const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
  const { user } = userCredential;

  const upperClassCodes = details.classCodes
    .map(code => code.trim().toUpperCase())
    .filter(Boolean);

  const newLecturer: Lecturer = {
    uid: user.uid,
    role: 'lecturer',
    email: details.email.trim(),
    courseCode: details.courseCode.trim().toUpperCase(),
    classCodes: upperClassCodes,
  };

  await setDoc(doc(db, 'users', user.uid), newLecturer, { merge: false });

  return newLecturer;
};


/* ---------------------- SIGN-IN & ACCOUNT CONTROL ---------------------- */

export const signInUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error(
      'Login blocked: Your account exists in auth but not in the system. Register again.'
    );
  }

  return userCredential;
};

export const signOutUser = () => signOut(auth);

export const sendPasswordReset = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};


/* ---------------------- ERROR HANDLING ---------------------- */

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


/* ---------------------- USER PROFILE ---------------------- */

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


/* ---------------------- STORAGE ---------------------- */

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


/* ---------------------- FIRESTORE DATA ---------------------- */

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


/* ---------------------- PEER REVIEW ---------------------- */

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


/* ---------------------- MEETING MODULE ---------------------- */

export const saveMeetingSession = (data: Omit<MeetingSession, 'id'>) =>
  addSession('meetingSessions', data);

export const getMeetingSessions = (u: UserProfile, c = 'ALL') =>
  getSessions<MeetingSession>('meetingSessions', u, c);

export const saveMeetingLecturerFeedback = (id: string, grade: number, feedback: string) =>
  updateSession('meetingSessions', id, { grade, lecturerFeedback: feedback, isGraded: true });


/* ---------------------- MINUTE TAKER ---------------------- */

export const saveMinuteTakingSession = (data: Omit<MinuteTakingSession, 'id'>) =>
  addSession('minuteTakingSessions', data);

export const getMinuteTakingSessions = (u: UserProfile, c = 'ALL') =>
  getSessions<MinuteTakingSession>('minuteTakingSessions', u, c);

export const saveMinuteTakingLecturerFeedback = (id: string, grade: number, fb: string) =>
  updateSession('minuteTakingSessions', id, { grade, lecturerFeedback: fb, isGraded: true });


/* ---------------------- COMPLAINT SESSIONS ---------------------- */

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