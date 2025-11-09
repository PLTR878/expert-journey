import { useEffect, useState } from "react";

export default function SettinMenu() {
  const [user, setUser] = useState("Guest");

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (u) setUser(u);
  }, []);

  const logout = () => {
    localStorage.removeItem("logged");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-5 pt-10">
      <h1 className="text-[20px] font-semibold mb-6">Settings</h1>

      <div className="bg-[#111827] p-4 rounded-xl border border-white/10 mb-8">
        <p className="text-gray-400 text-[12px]">Signed in as</p>
        <p className="text-[15px] font-medium mt-1">{user}</p>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-xl transition"
      >
        Logout
      </button>
    </div>
  );
}
