// ✅ FirebaseX.js — Config + Auth + Firestore (Ready for OriginX)
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔧 ตั้งค่าจาก Firebase ของพี่
const firebaseConfig = {
  apiKey: "AIzaSyBSwxLj8R_uL50v8f5XALVyKFwQMFECGKU",
  authDomain: "originx-5636e.firebaseapp.com",
  projectId: "originx-5636e",
  storageBucket: "originx-5636e.firebasestorage.app",
  messagingSenderId: "677130339175",
  appId: "1:677130339175:web:4ec184ef3dfda483eee5c2",
  measurementId: "G-6JN72D7BLS"
};

// ✅ เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Authentication และ Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Helper ฟังก์ชันติดตามสถานะผู้ใช้
export function observeUser(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

export default app;
