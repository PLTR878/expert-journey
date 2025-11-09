import { useState } from "react";

export default function VipPage() {
  const [code, setCode] = useState("");
  const realCode = "P254303"; // ✅ เปลี่ยนรหัสที่นี่

  const verify = () => {
    if (code === realCode) {
      localStorage.setItem("vip", "true");
      alert("✅ เข้าสู่ระบบ VIP สำเร็จ");
      window.location.reload();
    } else {
      alert("❌ รหัสไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <h1 className="text-xl text-emerald-400 font-bold mb-4">🔐 VIP Access</h1>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="ใส่รหัส VIP"
        className="w-full p-3 bg-[#111827] border border-white/10 rounded-xl mb-4"
      />

      <button
        onClick={verify}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl"
      >
        ✅ ยืนยัน
      </button>
    </div>
  );
}
