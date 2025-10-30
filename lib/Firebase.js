// ✅ /lib/Firebase.js — ใช้ตัวพิมพ์ใหญ่แน่นอน
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

// 🔹 เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);

// 🔹 สำหรับ Login / Register
export const auth = getAuth(app);

// 🔹 สำหรับเก็บข้อมูลใน Firestore
export const db = getFirestore(app);

export default app;
