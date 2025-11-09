import { useEffect, useState } from "react";

export default function SettinMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (u) setUser(u);
  }, []);

  const logout = () => {
    localStorage.removeItem("logged");
    localStorage.removeItem("username");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-5 pt-8">
      <h1 className="text-[20px] font-semibold mb-8">Settings</h1>

      <div className="bg-[#111827] p-4 rounded-lg border border-white/10 mb-8">
        <p className="text-gray-400 text-[13px]">Current Account</p>
        <p className="text-[16px] font-medium mt-1">
          {user || "Guest Mode"}
        </p>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-lg bg-red-500/80 hover:bg-red-500 transition text-[14px] font-medium"
      >
        Logout
      </button>
    </div>
  );
}
