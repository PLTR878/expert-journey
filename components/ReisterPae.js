import { useState } from "react";

export default function ReisterPae({ go }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleRegister(e) {
    e.preventDefault();

    // ✅ ตรวจสอบรหัสผ่านให้ตรงกัน
    if (password !== confirm) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    // ✅ บันทึกข้อมูลผู้ใช้จำลองไว้ใน localStorage
    const newUser = {
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("mockUser", JSON.stringify(newUser));
    localStorage.setItem("paid", "false"); // ยังไม่ได้ VIP

    // ✅ เด้งไปหน้า Login
    if (go) go("login");
    else window.location.reload();
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-xs shadow-xl">
        <h1 className="text-center text-emerald-400 font-extrabold text-xl mb-5">
          🧭 สมัครสมาชิก
        </h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
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

          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="ยืนยันรหัสผ่าน"
            className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg font-bold text-[15px] transition-all"
          >
            สมัครสมาชิก
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          มีบัญชีอยู่แล้ว?{" "}
          <span
            onClick={() => go && go("login")}
            className="text-emerald-400 font-semibold cursor-pointer hover:text-emerald-300"
          >
            เข้าสู่ระบบ
          </span>
        </p>
      </div>
    </main>
  );
    }
