import { useState } from "react";

export default function Register({ onRegister }) {
  const [user, setUser] = useState("");
  const [tel, setTel] = useState("");

  const register = () => {
    if (!user.trim() || !tel.trim()) {
      alert("กรอกชื่อ + เบอร์ ให้ครบก่อน");
      return;
    }

    // ✅ เก็บข้อมูลสมาชิก
    localStorage.setItem(
      "USER_DATA",
      JSON.stringify({ name: user.trim(), tel: tel.trim() })
    );

    alert("✅ สมัครสมาชิกสำเร็จ");

    // ✅ เด้งไปหน้า VIP เพื่อรอกรอกรหัส VIP
    window.location.href = "/vip";
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-12">
      <h1 className="text-2xl font-bold text-emerald-400 mb-6">
        สมัครสมาชิก
      </h1>

      <input
        placeholder="ตั้งชื่อผู้ใช้งาน"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 mb-4"
      />

      <input
        placeholder="เบอร์โทร"
        value={tel}
        onChange={(e) => setTel(e.target.value)}
        className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 mb-6"
      />

      <button
        onClick={register}
        className="w-full bg-emerald-500 hover:bg-emerald-400 py-3 rounded-xl text-black font-semibold"
      >
        ✅ ยืนยันการสมัคร
      </button>
    </div>
  );
          }
