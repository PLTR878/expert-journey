import { useState } from "react";

export default function VIPAccess({ onSuccess }) {
  const [code, setCode] = useState("");
  const VIP_KEY = "P254303"; // ✅ เปลี่ยนรหัสได้ตรงนี้

  const verify = () => {
    if (code === VIP_KEY) {
      localStorage.setItem("vip", "true");
      onSuccess();
    } else {
      alert("รหัสไม่ถูกต้อง ❌");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-16">
      <h1 className="text-2xl font-semibold text-emerald-400 mb-6">อัปเกรดเป็น VIP</h1>

      <input
        placeholder="กรอกรหัส VIP"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-white/10 mb-4"
      />

      <button
        onClick={verify}
        className="w-full bg-yellow-500 hover:bg-yellow-600 transition-all py-3 rounded-xl font-semibold"
      >
        ยืนยันรหัส VIP
      </button>
    </div>
  );
          }
