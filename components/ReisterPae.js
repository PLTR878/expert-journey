// components/ReisterPae.js
import { useState } from "react";
import { addUser } from "../utils/authStore";

export default function ReisterPae({ go }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !pw) return alert("กรอกอีเมลและรหัสผ่าน");
    if (pw !== pw2) return alert("รหัสผ่านไม่ตรงกัน");
    try {
      addUser(email.trim(), pw);
      alert("สมัครสมาชิกสำเร็จ ✅ โปรดเข้าสู่ระบบ");
      go("login");                       // ขั้นตอนถัดไป: เข้าสู่ระบบ
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err.message === "EXISTS") alert("อีเมลนี้มีบัญชีอยู่แล้ว");
      else alert("สมัครสมาชิกไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={handleRegister} className="w-full max-w-md bg-[#0f172a] p-6 rounded-2xl border border-white/10">
        <h1 className="text-emerald-400 font-extrabold text-xl mb-4">🧭 สมัครสมาชิก</h1>
        <input className="w-full mb-3 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
               placeholder="อีเมล" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full mb-3 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
               placeholder="รหัสผ่าน" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
        <input className="w-full mb-4 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
               placeholder="ยืนยันรหัสผ่าน" type="password" value={pw2} onChange={e=>setPw2(e.target.value)} />
        <button className="w-full bg-emerald-500 text-black font-extrabold py-2 rounded-xl">สมัครสมาชิก</button>
        <div className="text-center text-sm mt-3 text-gray-400">
          มีบัญชีอยู่แล้ว? <button type="button" className="text-emerald-400" onClick={()=>go("login")}>เข้าสู่ระบบ</button>
        </div>
      </form>
    </div>
  );
                 }
