// ✅ /components/VipPage.js
import { useState } from "react";

export default function VipPage() {
  const [code, setCode] = useState("");
  const realCode = "P254303"; // ✅ เปลี่ยนรหัสตรงนี้ได้ตลอด

  const verify = () => {
    if (code.trim() === realCode) {
      localStorage.setItem("vip", "true");
      alert("✅ เข้าสู่ระบบ VIP สำเร็จ");
      window.location.reload();
    } else {
      alert("❌ รหัสไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <h1 className="text-xl text-emerald-400 font-bold mb-4">🔐 VIP ACCESS</h1>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="กรอกรหัส VIP"
        className="w-full p-3 bg-[#111827] border border-white/10 rounded-xl mb-4 outline-none"
      />

      <button
        onClick={verify}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition"
      >
        ✅ ยืนยันเข้าใช้งาน VIP
      </button>
    </div>
  );
}
