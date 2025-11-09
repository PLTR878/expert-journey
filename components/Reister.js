import { useState } from "react";

export default function Reister({ onDone }) {
  const [user, setUser] = useState("");

  const register = () => {
    if (!user.trim()) return;
    localStorage.setItem("USER_DATA", user);
    onDone(); // ✅ สมัครเสร็จไปหน้า VIP
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-20">
      <h1 className="text-center text-2xl font-semibold text-emerald-400 mb-10">
        Register Account
      </h1>

      <input
        placeholder="ตั้งชื่อผู้ใช้งานของคุณ"
        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 mb-6 text-sm"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      />

      <button
        onClick={register}
        className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all py-3 rounded-xl text-black font-bold"
      >
        Confirm Register
      </button>
    </div>
  );
}
