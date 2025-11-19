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
  deleteField,
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

// Helper delay function to handle race conditions (small wrapper)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* ---------------------- AUTH (FINAL STABLE VERSION) ---------------------- */

export const signUpStudent = async (
  email: string,
  rawCourseCode: string,
  rawClassCode: string,
  password: string
) => {
  const course = rawCourseCode.trim().toUpperCase();
  const classCode = rawClassCode.trim().toUpperCase();

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

  // 1. Create Authentication User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  // Prepare the student object we want to persist
  const newStudent: any = {
    uid: user.uid,
    email: email.trim(),
    role: 'student',
    courseCode: course,
    classCode: classCode,
    lecturerEmail: matchedLecturer.email,
  };

  // STEP 1 — Immediately create user doc BEFORE triggers/extensions run
  // merge: true ensures we add our data to any existing placeholder doc
  await setDoc(doc(db, 'users', user.uid), newStudent, { merge: true });

  // STEP 2 — Wait briefly for any auth-trigger/extension to finish writing their fields
  // 1.5 seconds is usually sufficient; you can increase if you see races
  await delay(1500);

  // STEP 3 — Re-write required fields to override any trigger overwrite and remove unwanted fields
  await updateDoc(doc(db, 'users', user.uid), {
    ...newStudent,
    createdAt: deleteField(),
    displayName: deleteField(),
  });

  return newStudent as Student;
};


export const signUpLecturer = async (
  email: string,
  rawCourseCode: string,
  rawClassCodes: string[],
  password: string
) => {
  const upperClassCodes = rawClassCodes
    .map(code => code.trim().toUpperCase())
    .filter(Boolean);

  if (upperClassCodes.length === 0) {
    throw new Error("At least one Class ID is required.");
  }

  // Check if class codes are already registered by another lecturer
  const usersRef = collection(db, 'users');
  // Firestore limits 'array-contains-any' to 10 items per query.
  const chunks: string[][] = [];
  for (let i = 0; i < upperClassCodes.length; i += 10) {
      chunks.push(upperClassCodes.slice(i, i + 10));
  }

  for (const chunk of chunks) {
      const q = query(
          usersRef, 
          where('role', '==', 'lecturer'), 
          where('classCodes', 'array-contains-any', chunk)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
          const takenCodes = new Set<string>();
          snapshot.forEach(doc => {
              const data = doc.data() as Lecturer;
              if (data.classCodes) {
                  data.classCodes.forEach(code => {
                      if (chunk.includes(code)) takenCodes.add(code);
                  });
              }
          });
          
          if (takenCodes.size > 0) {
              throw new Error(`The following Class IDs are already registered by another lecturer: ${Array.from(takenCodes).join(', ')}`);
          }
      }
  }

  // 1. Create Authentication User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  const newLecturer: any = {
    uid: user.uid,
    role: 'lecturer',
    email: email.trim(),
    courseCode: rawCourseCode.trim().toUpperCase(),
    classCodes: upperClassCodes,
  };

  // STEP 1 — Immediately create lecturer in Firestore
  await setDoc(doc(db, 'users', user.uid), newLecturer, { merge: true });

  // STEP 2 — Wait briefly for any auth-trigger/extension to finish writing
  await delay(1500);

  // STEP 3 — Re-write required fields to override any trigger overwrite and remove unwanted fields
  await updateDoc(doc(db, 'users', user.uid), {
    ...newLecturer,
    createdAt: deleteField(),
    displayName: deleteField(),
  });

  return newLecturer as Lecturer;
};

// Helper function to clean up legacy/unwanted fields from existing profiles
export const cleanUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      createdAt: deleteField(),
      displayName: deleteField()
    });
  } catch (error) {
    // If fields don't exist or another error occurs, log it but don't crash the app
    console.warn(`Auto-cleanup for user ${uid} encountered an issue (possibly already clean):`, error);
  }
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
  await setDoc(doc(db, collectionName, id), data, { merge: true });
};

export const addSession = async (collectionName: string, data: object) => {
  const refCol = collection(db, collectionName);
  const docRef = await addDoc(refCol, data);
  return docRef.id;
};

export const updateSession = async (collectionName: string, id: string, data: object) => {
  await saveSession(collectionName, id, data);
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
