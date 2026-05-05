import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6lWT7-sukm2XG8_eG4LN_3sA2vcT3hK4",
  authDomain: "duo-app-872e7.firebaseapp.com",
  projectId: "duo-app-872e7",
  storageBucket: "duo-app-872e7.firebasestorage.app",
  messagingSenderId: "698062317493",
  appId: "1:698062317493:web:84be391e53d18bef031bfc",
  measurementId: "G-2GQ3BE70Z8"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization in Next.js dev mode)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
