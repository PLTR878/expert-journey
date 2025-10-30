// ✅ /lib/firebase.js — เชื่อม Firebase ของ OriginX
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSwxLj8R_uL50v8f5XALVyKFwQMFECGKU",
  authDomain: "originx-5636e.firebaseapp.com",
  projectId: "originx-5636e",
  storageBucket: "originx-5636e.firebasestorage.app",
  messagingSenderId: "677130339175",
  appId: "1:677130339175:web:4ec184ef3dfda483eee5c2",
  measurementId: "G-6JN72D7BLS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
