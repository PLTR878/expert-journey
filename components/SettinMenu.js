import { useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  const login = () => {
    if (user === "admin" && pass === "1234") {
      localStorage.setItem("logged", "yes");
      setMsg("✅ เข้าสู่ระบบสำเร็จ");
    } else {
      setMsg("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <section className="min-h-screen bg-[#0b1220] text-white p-6">
      <h1 className="text-2xl text-center font-bold mb-6 text-emerald-400">
        🔐 เข้าสู่ระบบ
      </h1>

      <input
        value={user}
        onChange={(e) => setUser(e.target.value)}
        placeholder="Username"
        className="w-full p-3 rounded bg-[#111827] border border-gray-600 mb-3"
      />

      <input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="Password"
        className="w-full p-3 rounded bg-[#111827] border border-gray-600 mb-3"
      />

      <button
        onClick={login}
        className="w-full py-3 bg-emerald-500/80 hover:bg-emerald-500 rounded text-white font-bold"
      >
        Login
      </button>

      {msg && (
        <p className="text-center mt-4 text-sm text-gray-300">{msg}</p>
      )}
    </section>
  );
          }
