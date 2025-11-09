import { useState, useEffect } from "react";

export default function SettinMenu() {
  const [theme, setTheme] = useState("dark");
  const [autoScan, setAutoScan] = useState(false);
  const [username, setUsername] = useState("Guest");
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "dark");
    setAutoScan(localStorage.getItem("autoScan") === "true");
    setUsername(localStorage.getItem("username") || "Guest");
    setIsVip(localStorage.getItem("vip") === "true");
  }, []);

  const toggleTheme = (val) => {
    setTheme(val);
    localStorage.setItem("theme", val);
  };

  const toggleAutoScan = () => {
    const val = !autoScan;
    setAutoScan(val);
    localStorage.setItem("autoScan", val);
  };

  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("vip");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 py-10">

      {/* Title */}
      <h1 className="text-[20px] font-semibold mb-6 text-emerald-400 flex items-center gap-2">
        ⚙️ OriginX Settings
      </h1>

      {/* User Status */}
      <div className="mb-8 bg-[#111827] border border-white/10 rounded-xl p-4">
        <p className="text-gray-300 text-sm mb-1">Signed in as</p>
        <p className="text-[16px] font-semibold text-white">{username}</p>
        <p className={`text-sm mt-1 ${isVip ? "text-yellow-400" : "text-gray-500"}`}>
          {isVip ? "🌟 VIP Member" : "Guest User"}
        </p>
      </div>

      {/* VIP Upgrade Button */}
      {!isVip && (
        <button
          onClick={() => (window.location.href = "/vip")}
          className="w-full bg-yellow-500/90 hover:bg-yellow-600 transition-all py-3 rounded-xl text-black font-semibold mb-8"
        >
          อัปเกรดเป็น VIP ⭐
        </button>
      )}

      {/* Theme */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm mb-2">Interface Theme</label>
        <select
          value={theme}
          onChange={(e) => toggleTheme(e.target.value)}
          className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-sm w-full"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      {/* Auto Scan */}
      <div className="mb-8 flex justify-between items-center">
        <span className="text-gray-300 text-sm">Auto Scan on Load</span>
        <button
          onClick={toggleAutoScan}
          className={`px-4 py-1 rounded-xl text-sm border border-white/10 ${
            autoScan ? "bg-emerald-500 text-black" : "bg-[#111827] text-gray-400"
          }`}
        >
          {autoScan ? "ON" : "OFF"}
        </button>
      </div>

      {/* Reset Data */}
      <button
        onClick={resetData}
        className="w-full bg-red-500/90 hover:bg-red-600 transition-all py-3 rounded-xl text-white font-semibold mb-10"
      >
        Reset All Data
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full border border-red-400 text-red-400 hover:bg-red-500 hover:text-white transition-all py-3 rounded-xl font-semibold"
      >
        Logout
      </button>
    </div>
  );
    }
