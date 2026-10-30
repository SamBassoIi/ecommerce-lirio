import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCMtqpOKJ_-_HwvfSesKnGx82_70aH6nnM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "liriobranco-c737f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "liriobranco-c737f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "liriobranco-c737f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "98859962652",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:98859962652:web:98ee72bc093cc3cff62ad9",
};

// Initialize Firebase only if it hasn't been initialized yet (avoids errors in development with Fast Refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
