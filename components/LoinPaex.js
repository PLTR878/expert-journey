import { useState } from "react";

export default function LoinPaex({ go, setUser, setPaid }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    const storedUser = localStorage.getItem("mockUser");
    if (!storedUser) {
      alert("ยังไม่มีบัญชี กรุณาสมัครสมาชิกก่อน");
      go("register");
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.email === email && user.password === password) {
      alert("เข้าสู่ระบบสำเร็จ ✅");
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("mockUser", JSON.stringify(user));
      setUser(user);

      const hasPaid = localStorage.getItem("paid") === "true";
      setPaid(hasPaid);
      go(hasPaid ? "market" : "vip");
    } else {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง ❌");
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-xs shadow-xl">
        <h1 className="text-center text-emerald-400 font-extrabold text-xl mb-5">🔑 เข้าสู่ระบบ</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg font-bold text-[15px]"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          ยังไม่มีบัญชี?{" "}
          <span
            onClick={() => go("register")}
            className="text-emerald-400 font-semibold cursor-pointer hover:text-emerald-300"
          >
            สมัครสมาชิก
          </span>
        </p>
      </div>
    </main>
  );
              }
