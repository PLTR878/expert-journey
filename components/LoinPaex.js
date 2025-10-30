// ✅ /components/LoinPaex.js — Login Page (Firebase Auth)
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoinPaex({ go, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      onAuth(userCred.user);
    } catch (err) {
      setError("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white px-5">
      <h1 className="text-2xl font-extrabold text-emerald-400 mb-6">
        🔐 OriginX Login
      </h1>

      <form onSubmit={handleLogin} className="space-y-4 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 bg-gray-800 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 bg-gray-800 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold py-3 rounded-xl transition-all"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-400">
        ยังไม่มีบัญชี?{" "}
        <button
          onClick={() => go("register")}
          className="text-emerald-400 font-bold underline"
        >
          สมัครสมาชิก
        </button>
      </p>
    </div>
  );
            }
