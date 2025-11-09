// ✅ /components/VipPage.js
import { useState } from "react";

export default function VipPage() {
  const [code, setCode] = useState("");
  const realCode = "P254303"; // ✅ เปลี่ยนรหัสตรงนี้ได้

  const verify = () => {
    if (code.trim() === realCode) {
      localStorage.setItem("vip", "true");
      alert("✅ VIP Access Granted");
      window.location.reload();
    } else {
      alert("❌ Incorrect Code");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">
      <h1 className="text-xl font-bold text-emerald-400 mb-4">VIP ACCESS</h1>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter VIP Code"
        className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 mb-4"
      />

      <button
        onClick={verify}
        className="w-full bg-emerald-500 rounded-xl py-3 font-bold text-black"
      >
        ✅ Confirm
      </button>
    </div>
  );
}
