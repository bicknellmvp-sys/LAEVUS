import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Robust env loading - works with Vercel and local .env
const getEnv = (key: string) => {
  return (import.meta as any).env?.[key] || '';
};

const firebaseConfig = {
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "gen-lang-client-0055687892",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:1062668147493:web:9ab97d404b473e4bfe58cc",
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyBDPVz2Y145lx76jHtf0Jvd_KWZl_KA5FY",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "gen-lang-client-0055687892.firebaseapp.com",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "gen-lang-client-0055687892.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "1062668147493"
};

const databaseId = getEnv('VITE_FIREBASE_DATABASE_ID') || "ai-studio-cheatcodeblavats-6d2b6398-47cd-48c4-b568-80d78500a1d5";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = databaseId && databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
