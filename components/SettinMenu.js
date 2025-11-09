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
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-5 pt-10">
      <h1 className="text-[20px] font-semibold mb-6">Settings</h1>

      <div className="mb-10">
        <p className="text-gray-400 text-[13px] mb-1">Current Account</p>
        <p className="text-[16px] font-medium">{user || "Guest Mode"}</p>
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-500/80 hover:bg-red-500 transition-all py-3 rounded-lg text-[14px] font-medium"
      >
        Logout
      </button>
    </div>
  );
}
