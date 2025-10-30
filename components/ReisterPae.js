// ✅ /components/ReisterPae.js — สมัครสมาชิก (Firebase + Firestore)
import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function ReisterPae() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ สมัครสมาชิกใน Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;

      // ✅ บันทึกข้อมูลผู้ใช้ลง Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      alert("✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      setEmail("");
      setPass("");
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex flex-col justify-center items-center px-6">
      <h1 className="text-2xl font-bold text-emerald-400 mb-6">สมัครสมาชิก OriginX</h1>
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 bg-[#141b2d] rounded-lg outline-none"
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
          className="w-full p-3 bg-[#141b2d] rounded-lg outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-lg"
        >
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>
    </div>
  );
    }
