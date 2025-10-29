// components/LoinPaex.js
import { useState } from "react";
import { getUsers, addUser, setCurrentUser } from "../utils/authStore";

export default function LoinPaex({ go, onAuth }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const mail = (email || "").trim();
    if (!mail || !pw) return alert("กรอกอีเมลและรหัสผ่าน");

    const users = getUsers();
    const found = users.find(u => u.email === mail && u.password === pw);

    if (found) {
      setCurrentUser({ email: found.email });
      alert("เข้าสู่ระบบสำเร็จ ✅");
      onAuth?.({ email: found.email });
      go("vip");
      window.scrollTo({ top: 0 });
      return;
    }

    // 👇 กันหลงทาง: ไม่พบในลิสต์ → สร้างบัญชีให้อัตโนมัติ แล้วล็อกอินทันที
    try {
      addUser(mail, pw);
      setCurrentUser({ email: mail });
      alert("สร้างบัญชีใหม่และเข้าสู่ระบบให้แล้ว ✅");
      onAuth?.({ email: mail });
      go("vip");
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err.message === "EXISTS") {
        alert("อีเมลนี้มีอยู่แล้ว แต่รหัสผ่านไม่ตรง");
      } else {
        alert("ไม่สามารถเข้าสู่ระบบได้");
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-[#0f172a] p-6 rounded-2xl border border-white/10">
        <h1 className="text-emerald-400 font-extrabold text-xl mb-4">🔑 เข้าสู่ระบบ</h1>
        <input
          className="w-full mb-3 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
          placeholder="อีเมล" type="email"
          value={email} onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="w-full mb-4 px-3 py-2 rounded-lg bg-[#111827] border border-gray-700"
          placeholder="รหัสผ่าน" type="password"
          value={pw} onChange={e=>setPw(e.target.value)}
        />
        <button className="w-full bg-emerald-500 text-black font-extrabold py-2 rounded-xl">
          เข้าสู่ระบบ
        </button>
        <div className="text-center text-sm mt-3 text-gray-400">
          ยังไม่มีบัญชี?{" "}
          <button type="button" className="text-emerald-400" onClick={()=>go("register")}>
            สมัครสมาชิก
          </button>
        </div>
      </form>
    </div>
  );
    }
