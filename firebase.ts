import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// =================================================================
// IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE
// =================================================================
// You can get this from your Firebase project console.
// Go to Project Settings (gear icon) > General > Your apps > Web app.
// Click on "SDK setup and configuration" and select "Config".
// Copy the configuration object and paste it below.
const firebaseConfig = {
  apiKey: "AIzaSyCaUDH4MgOpjrcCcfWUrGjXYqmrDMkAUQg",
  authDomain: "due37002.firebaseapp.com",
  projectId: "due37002",
  storageBucket: "due37002.firebasestorage.app",
  messagingSenderId: "403739265801",
  appId: "1:403739265801:web:1fcf441152563aba2e21d8"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get instances of Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };