import { useState } from "react";

export default function Reister({ goVip }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ✅ สมัครสมาชิก
  const register = () => {
    if (!user.trim() || !pass.trim()) return;

    const account = {
      username: user.trim(),
      password: pass.trim(),
      vip: ""
    };

    localStorage.setItem("account", JSON.stringify(account));

    alert("✅ สมัครสำเร็จ! กดเข้าสู่ระบบเพื่อเข้าใช้งาน");
  };

  // ✅ เข้าสู่ระบบ
  const login = () => {
    const account = JSON.parse(localStorage.getItem("account"));
    if (!account) return alert("⚠️ ยังไม่มีบัญชีบนอุปกรณ์นี้");

    if (loginUser.trim() === account.username && loginPass.trim() === account.password) {
      alert("✅ เข้าสู่ระบบสำเร็จ");
      goVip();
    } else {
      alert("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center px-8 text-white font-bold">

      <h1 className="text-[30px] font-extrabold mb-2 tracking-wide text-white">
        Welcome
      </h1>
      <p className="text-gray-400 mb-10 text-[15px] font-normal">
        Create your secure member account.
      </p>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <label className="text-gray-300 text-sm mb-2 block">Display Name</label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Ex. VisionTrader"
            className="w-full bg-[#111827] border border-white/10 px-4 py-3 rounded-xl"
          />
        </div>

        <div>
          <label className="text-gray-300 text-sm mb-2 block">Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Create Password"
            className="w-full bg-[#111827] border border-white/10 px-4 py-3 rounded-xl"
          />
        </div>
      </div>

      <button onClick={register} className="w-full max-w-sm mt-10 bg-emerald-400 text-black py-3 rounded-xl">
        Continue →
      </button>

      <button
        onClick={() => setShowLogin(true)}
        className="mt-6 text-emerald-300 text-[14px]"
      >
        Already have an account? Login
      </button>

      {/* ✅ POPUP LOGIN */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center px-8">
          <div className="bg-[#111827] w-full max-w-sm p-6 rounded-2xl">
            <h2 className="text-xl font-extrabold mb-4 text-center">เข้าสู่ระบบ</h2>

            <input
              placeholder="ชื่อผู้ใช้"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full bg-[#0d1320] border border-white/10 px-4 py-3 rounded-xl mb-4"
            />

            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full bg-[#0d1320] border border-white/10 px-4 py-3 rounded-xl mb-6"
            />

            <button onClick={login} className="w-full bg-emerald-400 text-black py-3 rounded-xl">
              เข้าสู่ VIP →
            </button>

            <button onClick={() => setShowLogin(false)} className="text-gray-400 mt-4 w-full text-center text-sm">
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
          }
        
