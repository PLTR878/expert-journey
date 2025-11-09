// ✅ /components/VipPage.js
import { useState, useEffect } from "react";

export default function VipPage() {
  const [code, setCode] = useState("");
  const realCode = "P254303"; // ✅ รหัส VIP (เปลี่ยนได้ตอนไหนก็ได้)

  // ✅ ถ้ายังไม่สมัคร → เด้งไป /register
  useEffect(() => {
    const user = localStorage.getItem("USER_DATA");
    if (!user) {
      window.location.href = "/register";
    }
  }, []);

  // ✅ ตรวจ VIP หมดอายุหรือยัง
  useEffect(() => {
    const expire = localStorage.getItem("VIP_EXPIRE");
    if (expire && Date.now() < Number(expire)) {
      window.location.href = "/"; // ยังไม่หมด → เข้าใช้งานได้
    }
  }, []);

  const verify = () => {
    if (code.trim() === realCode) {
      const expireTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 วัน

      localStorage.setItem("VIP_OK", "yes");
      localStorage.setItem("VIP_EXPIRE", expireTime);

      alert("✅ VIP Access Granted (30 days)");
      window.location.href = "/";
    } else {
      alert("❌ Incorrect VIP Code");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-12">
      <h1 className="text-2xl font-bold text-emerald-400 mb-6">VIP ACCESS</h1>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter VIP Code"
        className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 mb-4"
      />

      <button
        onClick={verify}
        className="w-full bg-emerald-500 hover:bg-emerald-400 py-3 rounded-xl text-black font-semibold"
      >
        ✅ Confirm
      </button>
    </div>
  );
          }
