// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// =================================================================
// Firebase configuration
// Get these from your Firebase console: Project Settings > Your apps > Web app
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCaUDH4MgOpjrcCcfWUrGjXYqmrDMkAUQg",
  authDomain: "due37002.firebaseapp.com",
  projectId: "due37002",
  storageBucket: "due37002.appspot.com",
  messagingSenderId: "403739265801",
  appId: "1:403739265801:web:1fcf441152563aba2e21d8"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in your app
export const auth = getAuth(app);           // Authentication
export const db = getFirestore(app);        // Firestore database
export const storage = getStorage(app);     // Storage bucket
