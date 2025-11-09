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
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center text-white px-8">
      <h1 className="text-2xl font-bold mb-6">Create Account</h1>

      <input
        placeholder="Enter your name"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        className="bg-[#111827] w-full border border-white/10 px-4 py-2 rounded-xl mb-6"
      />

      <button
        onClick={register}
        className="w-full bg-emerald-500 py-3 rounded-xl font-semibold"
      >
        Continue
      </button>
    </div>
  );
}
