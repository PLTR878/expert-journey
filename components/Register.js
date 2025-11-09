import { useState } from "react";

export default function Register({ onRegister }) {
  const [user, setUser] = useState("");

  const register = () => {
    if (!user.trim()) return;
    localStorage.setItem("username", user);
    localStorage.setItem("vip", "false");
    onRegister();
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-16">
      <h1 className="text-2xl font-semibold text-emerald-400 mb-6">สมัครสมาชิก</h1>

      <input
        placeholder="ตั้งชื่อผู้ใช้งาน"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-white/10 mb-4"
      />

      <button
        onClick={register}
        className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all py-3 rounded-xl font-semibold"
      >
        สมัครสมาชิก
      </button>
    </div>
  );
    }
