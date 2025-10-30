// ✅ /lib/Firebase.js — เวอร์ชันเชื่อมเต็มระบบพร้อมใช้
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSwxLj8R_uL50v8f5XALVyKFwQMFECGKU",
  authDomain: "originx-5636e.firebaseapp.com",
  projectId: "originx-5636e",
  storageBucket: "originx-5636e.firebasestorage.app",
  messagingSenderId: "677130339175",
  appId: "1:677130339175:web:4ec184ef3dfda483eee5c2",
  measurementId: "G-6JN72D7BLS",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔹 บันทึกข้อมูลผู้ใช้หลังสมัคร
export async function saveUserData(user) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    email: user.email,
    createdAt: new Date(),
  }, { merge: true });
}

// 🔹 โหลดข้อมูลผู้ใช้จาก Firestore
export async function loadUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// 🔹 ฟังก์ชันสมัครสมาชิก
export async function registerUser(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await saveUserData(user);
  return user;
}

// 🔹 ฟังก์ชันล็อกอิน
export async function loginUser(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// 🔹 ฟังก์ชันตรวจจับสถานะล็อกอิน
export function observeUser(callback) {
  return onAuthStateChanged(auth, callback);
}

// 🔹 ฟังก์ชันออกจากระบบ
export async function logoutUser() {
  await signOut(auth);
}

export default app;
