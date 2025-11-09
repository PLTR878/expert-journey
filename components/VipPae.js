import { useState } from "react";

export default function VipPae({ onVIP }) {
  const [code, setCode] = useState("");
  const realCode = "P254303"; // เปลี่ยนโค้ดตรงนี้ได้เอง

  const verify = () => {
    if (code.trim() === realCode) {
      if (typeof window !== "undefined") {
        localStorage.setItem("vip", "yes");
      }
      onVIP();
    } else {
      alert("❌ Incorrect VIP Code");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center text-white px-8">
      <h1 className="text-2xl font-bold text-emerald-400 mb-6">VIP ACCESS</h1>

      <input
        placeholder="Enter VIP Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="bg-[#111827] w-full border border-white/10 px-4 py-2 rounded-xl mb-6"
      />

      <button
        onClick={verify}
        className="w-full bg-emerald-500 py-3 rounded-xl font-semibold"
      >
        Confirm
      </button>
    </div>
  );
}
