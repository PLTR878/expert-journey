// ✅ FutureDiscovery.js — Visionary AI: หุ้นต้นน้ำ อนาคตไกล (V∞.5)
import { useEffect, useState } from "react";

export default function FutureDiscovery() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDiscovery();
  }, []);

  // ✅ โหลดข้อมูลจาก API ใหม่ (visionary-discovery-pro)
  async function loadDiscovery() {
    try {
      setLoading(true);
      setError("");
      setProgress(0);

      // จำลองการอัปเดต progress ระหว่าง AI สแกน
      const progressTimer = setInterval(() => {
        setProgress((p) => (p < 95 ? p + Math.random() * 5 : p));
      }, 200);

      const res = await fetch("/api/visionary-discovery-pro", { cache: "no-store" });
      if (!res.ok) throw new Error(`API Error ${res.status}`);

      const j = await res.json();
      clearInterval(progressTimer);
      setProgress(100);

      const arr = j.discovered || [];
      if (!Array.isArray(arr) || arr.length === 0)
        throw new Error("ไม่พบข้อมูลหุ้นจาก AI");

      setList(
        arr.map((r) => ({
          symbol: r.symbol,
          name: r.name || "Unknown",
          reason: r.reason || "AI พบศักยภาพในอนาคต",
          score: r.aiScore || 0,
          price: r.price || 0,
          sector: r.exchange || "General",
          trend: r.aiScore > 80 ? "Uptrend" : "Sideway",
          signal:
            r.aiScore > 85
              ? "Buy"
              : r.aiScore < 75
              ? "Sell"
              : "Hold",
        }))
      );
    } catch (err) {
      console.error("⚠️ Load discovery failed:", err);
      setError(err.message || "ไม่สามารถเชื่อมต่อกับระบบ AI ได้");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  const handleReload = () => {
    loadDiscovery();
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white px-4 py-4">
      {/* Header */}
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-emerald-400 font-bold text-lg">
            🌋 หุ้นต้นน้ำ อนาคตไกล (AI Future Discovery Pro)
          </h1>
          <p className="text-gray-400 text-sm">
            AI วิเคราะห์เทคโนโลยี แนวโน้ม และโอกาสเติบโต เพื่อค้นหาหุ้นที่อาจเปลี่ยนโลกในอนาคต
          </p>
        </div>

        <button
          onClick={handleReload}
          className={`text-[12px] px-2 py-[4px] border border-emerald-400/50 rounded-md text-emerald-300 hover:bg-emerald-600/20 transition-all ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {loading ? "⏳ กำลังโหลด..." : "🔄 Refresh"}
        </button>
      </header>

      {/* Progress Bar */}
      {loading && (
        <div className="mt-4 mb-2">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-gray-400 text-[11px] mt-1 text-right">
            {Math.floor(progress)}% กำลังวิเคราะห์หุ้นทั้งหมด...
          </div>
        </div>
      )}

      {/* เนื้อหาหลัก */}
      {loading ? (
        <div className="text-center text-gray-500 mt-10 animate-pulse">
          🤖 AI กำลังสแกนหุ้นทั้งตลาด... โปรดรอสักครู่
        </div>
      ) : error ? (
        <div className="text-center text-red-400 mt-10">
          ⚠️ {error}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          ❌ ยังไม่พบหุ้นที่ AI มองว่าเป็นต้นน้ำ
        </div>
      ) : (
        <>
          <div className="text-gray-400 text-sm mb-2">
            พบหุ้นทั้งหมด {list.length} ตัว
          </div>
          <div className="flex flex-col divide-y divide-gray-800/50">
            {list.map((s, i) => (
              <a
                href={`/analyze/${s.symbol}`}
                key={i}
                className="flex justify-between items-center py-3 px-2 hover:bg-[#111827]/50 rounded-md transition-all"
              >
                {/* ฝั่งซ้าย */}
                <div>
                  <div className="font-bold text-[15px]">{s.symbol}</div>
                  <div className="text-gray-400 text-[12px]">{s.name}</div>
                  <div className="text-emerald-400 text-[11px] mt-[2px] max-w-[220px] truncate">
                    📡 {s.reason}
                  </div>
                </div>

                {/* ฝั่งขวา */}
                <div className="text-right font-mono">
                  <div className="text-[13px]">${s.price?.toFixed(2)}</div>
                  <div
                    className={`text-[12px] font-bold ${
                      s.signal === "Buy"
                        ? "text-green-400"
                        : s.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {s.signal}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    AI {Math.round(s.score)}%
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  );
      }
