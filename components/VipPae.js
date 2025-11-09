import { useState } from "react";

export default function VipPae({ onSuccess }) {
  const [code, setCode] = useState("");

  const realCode = "P254303"; // ✅ เปลี่ยนรหัสได้ทุกเมื่อ

  const verify = () => {
    if (code.trim() === realCode) {
      localStorage.setItem("vip", "true");
      alert("✅ VIP Activated");
      onSuccess();
      window.location.reload();
    } else {
      alert("❌ Incorrect VIP Code");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-20">
      <h1 className="text-center text-2xl font-semibold text-emerald-400 mb-10">
        VIP ACCESS
      </h1>

      <input
        placeholder="Enter VIP Code"
        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 mb-6 text-sm"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={verify}
        className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all py-3 rounded-xl text-black font-bold"
      >
        Confirm
      </button>
    </div>
  );
    }
