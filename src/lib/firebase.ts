import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCMtqpOKJ_-_HwvfSesKnGx82_70aH6nnM",
  authDomain: "liriobranco-c737f.firebaseapp.com",
  projectId: "liriobranco-c737f",
  storageBucket: "liriobranco-c737f.firebasestorage.app",
  messagingSenderId: "98859962652",
  appId: "1:98859962652:web:98ee72bc093cc3cff62ad9"
};

// Initialize Firebase only if it hasn't been initialized yet (avoids errors in development with Fast Refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
