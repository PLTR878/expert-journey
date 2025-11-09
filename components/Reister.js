import { useState } from "react";

export default function Reister({ onRegister, goVip }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const register = () => {
    if (!user.trim() || !pass.trim()) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("username", user);
      localStorage.setItem("password", pass);
      localStorage.setItem("vip", "");
    }

    onRegister();
  };

  const login = () => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("username");
      const savedPass = localStorage.getItem("password");

      if (loginUser.trim() === savedName && loginPass.trim() === savedPass) {
        localStorage.setItem("vip", "yes");
        setShowLogin(false);
        goVip(); // ✅ เด้งไปหน้าหลักของระบบ
      } else {
        alert("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center px-8 text-white font-bold">

      <h1 className="text-[30px] font-extrabold mb-2 tracking-wide">
        Welcome
      </h1>
      <p className="text-gray-400 mb-10 text-[15px] font-normal">
        Create your secure member account.
      </p>

      <div className="w-full max-w-sm space-y-6">

        {/* Display Name */}
        <div>
          <label className="text-gray-300 text-sm mb-2 block">Display Name</label>
          <input
            placeholder="Ex. VisionTrader"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 focus:border-emerald-400 transition px-4 py-3 rounded-xl outline-none text-[15px] font-medium"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-gray-300 text-sm mb-2 block">Password</label>
          <input
            type="password"
            placeholder="Create a secure password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 focus:border-emerald-400 transition px-4 py-3 rounded-xl outline-none text-[15px] font-medium"
          />
        </div>
      </div>

      {/* Register Button */}
      <button
        onClick={register}
        className="w-full max-w-sm mt-10 bg-emerald-400 hover:bg-emerald-300 transition py-3 rounded-xl font-extrabold text-black tracking-wide text-[16px]"
      >
        Continue →
      </button>

      {/* Open Login Popup */}
      <button
        onClick={() => setShowLogin(true)}
        className="mt-6 text-emerald-300 hover:text-emerald-200 text-[14px] font-normal"
      >
        Already have an account? Login
      </button>

      {/* ✅ POPUP LOGIN */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center px-8">
          <div className="bg-[#111827] w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-2xl">

            <h2 className="text-xl font-extrabold mb-6 text-center">เข้าสู่ระบบ</h2>

            <input
              placeholder="Display Name"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full bg-[#0d1322] border border-white/10 px-4 py-3 rounded-xl outline-none text-[15px] mb-4"
            />

            <input
              type="password"
              placeholder="รหัสผ่านของคุณ"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full bg-[#0d1322] border border-white/10 px-4 py-3 rounded-xl outline-none text-[15px] mb-6"
            />

            <button
              onClick={login}
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-black py-3 rounded-xl font-extrabold text-[15px] tracking-wide"
            >
              เข้าสู่ VIP →
            </button>

            <button
              onClick={() => setShowLogin(false)}
              className="text-gray-400 hover:text-gray-200 mt-4 w-full text-center text-sm"
            >
              ยกเลิก
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
