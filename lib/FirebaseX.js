// ✅ /lib/FirebaseX.js — Firebase เต็มระบบ เชื่อม Authentication + Firestore
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSwxLj8R_uL50v8f5XALVyKFwQMFECGKU",
  authDomain: "originx-5636e.firebaseapp.com",
  projectId: "originx-5636e",
  storageBucket: "originx-5636e.firebasestorage.app",
  messagingSenderId: "677130339175",
  appId: "1:677130339175:web:4ec184ef3dfda483eee5c2",
  measurementId: "G-6JN72D7BLS"
};

// ✅ เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ ฟังก์ชันสมัครสมาชิก
export async function registerUser(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, { email: user.email, createdAt: new Date() }, { merge: true });
  return user;
}

// ✅ ฟังก์ชันเข้าสู่ระบบ
export async function loginUser(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ✅ โหลดข้อมูลผู้ใช้
export async function loadUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ✅ ตรวจจับสถานะล็อกอิน
export function observeUser(callback) {
  return onAuthStateChanged(auth, callback);
}

// ✅ ออกจากระบบ
export async function logoutUser() {
  await signOut(auth);
}

export default app;
