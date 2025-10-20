// ✅ FutureDiscovery.js — Visionary AI: หุ้นต้นน้ำ อนาคตไกล
import { useEffect, useState } from "react";

export default function FutureDiscovery() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscovery();
  }, []);

  async function loadDiscovery() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-discovery", { cache: "no-store" });
      const j = await res.json();
      const arr = j.stocks || j.discovery || j.results || [];

      setList(
        arr.map((r) => ({
          symbol: r.symbol,
          name: r.company || "Unknown",
          reason: r.reason || "AI พบศักยภาพในอนาคต",
          score: r.aiScore || 0,
          price: r.price || 0,
          sector: r.sector || "General",
          trend: r.trend || "Neutral",
          signal: r.signal || "Hold",
        }))
      );
    } catch (err) {
      console.error("⚠️ Load discovery failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white px-4 py-4">
      <header className="mb-4">
        <h1 className="text-emerald-400 font-bold text-lg">
          🌋 หุ้นต้นน้ำ อนาคตไกล (AI Future Discovery)
        </h1>
        <p className="text-gray-400 text-sm">
          AI วิเคราะห์ข่าว เทคโนโลยี และแนวโน้มเศรษฐกิจ เพื่อค้นหาหุ้นที่อาจเปลี่ยนโลกในอนาคต
        </p>
      </header>

      {loading ? (
        <div className="text-center text-gray-500 mt-10">⏳ กำลังวิเคราะห์อนาคต...</div>
      ) : list.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          ❌ ยังไม่พบหุ้นที่ AI เห็นว่าเป็นต้นน้ำ
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {list.map((s, i) => (
            <a
              href={`/analyze/${s.symbol}`}
              key={i}
              className="flex justify-between items-center py-3 px-2 hover:bg-[#111827]/50 rounded-md transition-all"
            >
              <div>
                <div className="font-bold text-[15px]">{s.symbol}</div>
                <div className="text-gray-400 text-[12px]">{s.name}</div>
                <div className="text-emerald-400 text-[11px] mt-[2px] max-w-[220px] truncate">
                  📡 {s.reason}
                </div>
              </div>
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
                  {s.score ? `AI ${Math.round(s.score)}%` : ""}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
    }
