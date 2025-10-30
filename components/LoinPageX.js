// ✅ /components/LoinPageX.js — หน้าเข้าสู่ระบบ
import { useState } from "react";
import { loginUser } from "../lib/FirebaseX";

export default function LoinPageX({ go, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      onAuth(user);
    } catch (err) {
      setError("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center mt-20">
      <h2 className="text-xl font-bold text-emerald-400 mb-3">เข้าสู่ระบบ</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 max-w-xs mx-auto">
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 px-4 py-2 rounded text-white"
          required
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-800 px-4 py-2 rounded text-white"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 py-2 rounded font-bold"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="mt-4 text-sm">
        ยังไม่มีบัญชี?{" "}
        <button onClick={() => go("register")} className="text-emerald-400 underline">
          สมัครสมาชิก
        </button>
      </p>
    </div>
  );
}
