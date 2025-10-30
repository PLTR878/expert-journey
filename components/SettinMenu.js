// ✅ components/SettinMenu.js — หน้าการตั้งค่าหลัก (ไม่มีตัว g)
import { useState, useEffect } from "react";

export default function SettinMenu() {
  const [theme, setTheme] = useState("dark");
  const [autoScan, setAutoScan] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedAuto = localStorage.getItem("autoScan");
    if (savedTheme) setTheme(savedTheme);
    if (savedAuto) setAutoScan(savedAuto === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("autoScan", autoScan);
  }, [theme, autoScan]);

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 py-8">
      <h1 className="text-[20px] font-extrabold mb-6 text-emerald-400 tracking-wide">
        ⚙️ OriginX Settings
      </h1>

      <div className="space-y-6">
        {/* โหมดธีม */}
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold text-gray-200">
            Interface Theme
          </span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-[#111827] border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        {/* Auto Scan */}
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold text-gray-200">
            Auto Scan on Load
          </span>
          <button
            onClick={() => setAutoScan((p) => !p)}
            className={`px-4 py-1 rounded-lg text-sm font-extrabold ${
              autoScan ? "bg-emerald-500 text-black" : "bg-gray-700 text-gray-300"
            }`}
          >
            {autoScan ? "ON" : "OFF"}
          </button>
        </div>

        {/* Reset */}
        <div className="pt-6 border-t border-gray-700">
          <button
            onClick={() => {
              localStorage.clear();
              alert("✅ Settings & Cache Cleared!");
              window.location.reload();
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-2 rounded-xl transition-all"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
              }
