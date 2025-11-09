import { useState } from "react";

export default function Reister({ onRegister }) {
  const [user, setUser] = useState("");

  const register = () => {
    if (!user.trim()) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("username", user);
      localStorage.setItem("vip", "");
    }

    onRegister();
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center px-8 text-white">

      {/* Header */}
      <h1 className="text-[28px] font-bold mb-2 tracking-wide text-emerald-400">
        Welcome
      </h1>
      <p className="text-gray-400 mb-10 text-[14px]">
        Create your member profile to continue.
      </p>

      {/* Input box */}
      <div className="w-full max-w-sm">
        <label className="text-gray-300 text-sm mb-2 block">Display Name</label>
        <input
          placeholder="Ex. Tanasak Trader"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="w-full bg-[#111827] border border-white/10 focus:border-emerald-400 transition-all px-4 py-3 rounded-xl outline-none text-[14px]"
        />
      </div>

      {/* Button */}
      <button
        onClick={register}
        className="w-full max-w-sm mt-8 bg-emerald-500 hover:bg-emerald-400 transition-all py-3 rounded-xl font-semibold text-black tracking-wide text-[15px]"
      >
        Continue →
      </button>

      {/* Footer tip */}
      <p className="text-gray-500 text-[12px] mt-6">
        Your account will be stored securely on this device.
      </p>

    </div>
  );
      }
