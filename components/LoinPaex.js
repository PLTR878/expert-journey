// components/LoinPaex.js
import { useState } from "react";
import { getUsers, setCurrentUser } from "../utils/authStore";

export default function LoinPaex({ go, onAuth }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const users = getUsers();
    const ok = users.find(u => u.email === email.trim() && u.password === pw);
    if (!ok) {
      alert("ยังไม่มีบัญชี กรุณาสมัครสมาชิกก่อน");
      return go("register");
    }
    setCurrentUser({ email: ok.email });
    alert("เข้าสู่ระบบสำเร็จ ✅");
    onAuth?.({ email: ok.email });   // แจ้ง parent อัปเดต state
    go("vip");                       // ไปหน้าสมัคร VIP ตาม flow
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-[#0f172a] p-6 rounded-2xl border border-white/10">
        <h1 className="text-emerald-400 font-extrabold text-xl mb-4">🔑 เข้าสู่ระบบ</h1>
        <input className="w-full mb-3 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
               placeholder="อีเมล" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full mb-4 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
               placeholder="รหัสผ่าน" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
        <button className="w-full bg-emerald-500 text-black font-extrabold py-2 rounded-xl">เข้าสู่ระบบ</button>
        <div className="text-center text-sm mt-3 text-gray-400">
          ยังไม่มีบัญชี? <button type="button" className="text-emerald-400" onClick={()=>go("register")}>สมัครสมาชิก</button>
        </div>
      </form>
    </div>
  );
}
