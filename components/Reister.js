import { useState } from "react";

export default function Reister({ onRegister }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const register = () => {
    if (!user.trim() || !pass.trim()) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("username", user);
      localStorage.setItem("password", pass);
      localStorage.setItem("vip", "");
    }

    onRegister();
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center px-8 text-white font-bold">

      {/* Header */}
      <h1 className="text-[30px] font-extrabold mb-2 tracking-wide text-white">
        Welcome
      </h1>
      <p className="text-gray-400 mb-10 text-[15px] font-normal">
        Create your secure member account.
      </p>

      <div className="w-full max-w-sm space-y-6">

        {/* Username */}
        <div>
          <label className="text-gray-300 text-sm mb-2 block">
            Display Name
          </label>
          <input
            placeholder="Ex. VisionTrader"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 focus:border-emerald-400 transition-all px-4 py-3 rounded-xl outline-none text-[15px] font-medium"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-gray-300 text-sm mb-2 block">
            Password
          </label>
          <input
            type="password"
            placeholder="Create a secure password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 focus:border-emerald-400 transition-all px-4 py-3 rounded-xl outline-none text-[15px] font-medium"
          />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={register}
        className="w-full max-w-sm mt-10 bg-emerald-400 hover:bg-emerald-300 transition-all py-3 rounded-xl font-extrabold text-black tracking-wide text-[16px]"
      >
        Continue →
      </button>

      <p className="text-gray-500 text-[12px] mt-6 font-normal">
        Your account is stored securely in this device only.
      </p>

    </div>
  );
    }
