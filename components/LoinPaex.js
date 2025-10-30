// ✅ /components/LoinPaex.js — เข้าสู่ระบบ (Firebase)
import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoinPaex() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      alert("🎉 เข้าสู่ระบบสำเร็จ: " + user.email);
      localStorage.setItem("user", JSON.stringify({ email: user.email, uid: user.uid }));
      window.location.href = "/"; // เปลี่ยนหน้าไปหน้าแรกหลังล็อกอิน
    } catch (err) {
      alert("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex flex-col justify-center items-center px-6">
      <h1 className="text-2xl font-bold text-emerald-400 mb-6">เข้าสู่ระบบ OriginX</h1>
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
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
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
            }
