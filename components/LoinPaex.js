import { useState } from "react";

export default function LoinPaex({ go }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    // ✅ ดึงข้อมูลผู้ใช้จาก localStorage
    const stored = localStorage.getItem("mockUser");
    if (!stored) {
      alert("ยังไม่มีบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิกก่อน");
      go("register");
      return;
    }

    const user = JSON.parse(stored);

    // ✅ ตรวจสอบอีเมล + รหัสผ่าน
    if (user.email === email && user.password === password) {
      alert("เข้าสู่ระบบสำเร็จ ✅");

      // ✅ ตั้งสถานะผู้ใช้ในระบบ
      localStorage.setItem("loggedIn", "true");

      // ✅ เปลี่ยนไปหน้าสมัคร VIP
      go("vip"); // ← ตรงนี้สำคัญมาก
    } else {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง ❌");
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-xs shadow-xl">
        <h1 className="text-center text-emerald-400 font-extrabold text-xl mb-5">
          🔑 เข้าสู่ระบบ
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg font-bold text-[15px] transition-all"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          ยังไม่มีบัญชี?{" "}
          <span
            onClick={() => go && go("register")}
            className="text-emerald-400 font-semibold cursor-pointer hover:text-emerald-300"
          >
            สมัครสมาชิก
          </span>
        </p>
      </div>
    </main>
  );
              }
