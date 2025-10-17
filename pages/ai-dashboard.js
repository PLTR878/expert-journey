// ✅ /pages/ai-dashboard.js — AI Super Dashboard Ultimate Infinity 🚀
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AIDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลทุก 30 วิ
  async function fetchData() {
    setLoading(true);
    try {
      const r = await fetch(`/api/screener?horizon=short&limit=100`);
      const j = await r.json();
      const ranked = (j.results || [])
        .filter(x => x.signal === "Buy" && x.conf >= 0.6)
        .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
        .slice(0, 10);
      setData(ranked);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-400 mb-2">
            🤖 AI Super Investor Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Top 10 หุ้นที่ AI มั่นใจมากที่สุดตอนนี้ (อัปเดตทุก 30 วิ)
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">⏳ กำลังดึงข้อมูล...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((s, i) => (
              <Link
                href={`/analyze/${s.symbol}`}
                key={i}
                className="border border-white/10 rounded-2xl bg-gradient-to-b from-[#141b2d] to-[#0b1220] p-4 hover:border-emerald-400/40 hover:scale-[1.02] transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-white">{s.symbol}</span>
                  <span className="text-sm text-gray-400">#{i + 1}</span>
                </div>

                <div className="text-[14px] text-gray-300">
                  <div>💰 Price: <b className="text-emerald-400">${s.lastClose?.toFixed(2) || "-"}</b></div>
                  <div>📈 RSI: <b className="text-yellow-400">{s.rsi?.toFixed(1)}</b></div>
                  <div>🎯 Confidence: <b className="text-sky-400">{Math.round((s.confidence ?? 0.5) * 100)}%</b></div>
                  <div>🧭 Target: <b className="text-emerald-400">${s.target?.toFixed(2) || "-"}</b></div>
                </div>

                <div className="mt-3 h-2 bg-[#1a2338] rounded-full overflow-hidden">
                  <div
                    className="h-2 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (s.confidence ?? 0.5) * 100)}%`,
                      background:
                        s.confidence > 0.7
                          ? "#00ff95"
                          : s.confidence > 0.5
                          ? "#facc15"
                          : "#ff4455",
                    }}
                  />
                </div>

                <div className="mt-3 text-[13px] text-gray-400 italic">
                  {s.signal === "Buy"
                    ? "🔥 AI แนะนำซื้อ"
                    : s.signal === "Sell"
                    ? "⚠️ ระวังแรงขาย"
                    : "🟡 ถือรอดูสถานการณ์"}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Galaxy Map */}
        <section className="mt-10 bg-[#10182b] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">
            🌌 AI Galaxy Trend Map (ตลาดภาพรวม)
          </h2>
          <div className="grid grid-cols-10 gap-[2px]">
            {Array.from({ length: 100 }).map((_, i) => {
              const c = i % 3 === 0 ? "#22c55e" : i % 3 === 1 ? "#facc15" : "#ef4444";
              return (
                <div
                  key={i}
                  className="w-5 h-5 rounded-sm transition-all duration-300 hover:scale-125"
                  style={{ background: c, opacity: 0.8 }}
                ></div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs text-gray-400">
            <div>🟢 Uptrend</div>
            <div>🟡 Sideway</div>
            <div>🔴 Downtrend</div>
          </div>
        </section>

      </div>
    </main>
  );
    }
