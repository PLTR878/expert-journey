// ✅ components/OptionXSection.js — ระบบ OptionX (AI Reversal / Call-Put)
import { useState, useEffect } from "react";
import Link from "next/link";

export default function OptionXSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    rsiMin: 30,
    rsiMax: 70,
    minScore: 70,
  });

  async function loadOptionData() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      let data = j.results || [];

      data = data.map((x) => {
        const rsi = x.rsi || 50;
        const aiScore = x.aiScore || 50;
        let signal = "NEUTRAL";

        if (rsi < filters.rsiMin) signal = "CALL";
        else if (rsi > filters.rsiMax) signal = "PUT";

        return { ...x, signal, aiScore, rsi };
      });

      data = data.filter((x) => x.aiScore >= filters.minScore);
      setResults(data);
    } catch (e) {
      console.error("OptionX load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptionData();
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-[18px] font-extrabold text-emerald-400 tracking-wide">
            💹 OptionX — AI Reversal & Option Signal
          </h1>
          <button
            onClick={loadOptionData}
            disabled={loading}
            className={`px-4 py-[6px] rounded-md border border-gray-500 bg-transparent text-sm font-extrabold ${
              loading
                ? "text-gray-500 cursor-wait"
                : "text-white hover:text-emerald-400 hover:bg-[#1f2937]/40"
            }`}
          >
            {loading ? "Loading..." : "Rescan"}
          </button>
        </div>

        {/* ตัวตั้งค่า */}
        <div className="grid grid-cols-3 gap-2 mb-5 text-sm">
          <div>
            <label className="block text-gray-400">RSI Min</label>
            <input
              type="number"
              value={filters.rsiMin}
              onChange={(e) => setFilters({ ...filters, rsiMin: Number(e.target.value) })}
              className="w-full bg-[#111827] border border-gray-600 rounded px-2 py-1 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400">RSI Max</label>
            <input
              type="number"
              value={filters.rsiMax}
              onChange={(e) => setFilters({ ...filters, rsiMax: Number(e.target.value) })}
              className="w-full bg-[#111827] border border-gray-600 rounded px-2 py-1 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400">AI Score ≥</label>
            <input
              type="number"
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: Number(e.target.value) })}
              className="w-full bg-[#111827] border border-gray-600 rounded px-2 py-1 text-white"
            />
          </div>
        </div>

        {/* ตารางผลลัพธ์ */}
        <div className="divide-y divide-gray-800/40">
          {results.length === 0 && !loading && (
            <p className="text-center text-gray-500 italic py-10">ไม่มีข้อมูลตรงตามตัวกรอง</p>
          )}
          {results.map((r, i) => (
            <Link
              key={i}
              href={`/analyze/${r.symbol}`}
              className="flex justify-between items-center py-2 hover:bg-[#111827]/30 transition"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0b0f17] border border-gray-700 text-[11px] font-bold text-gray-300">
                  {r.symbol}
                </div>
                <div>
                  <div className="font-bold text-[13.5px]">{r.symbol}</div>
                  <div className="text-[11px] text-gray-400">{r.companyName}</div>
                </div>
              </div>
              <div className="text-right font-mono text-[12px] leading-tight space-y-[2px]">
                <div className="text-[13px] font-bold text-white">${r.last?.toFixed(2) || "-"}</div>
                <div
                  className={`font-bold ${
                    r.signal === "CALL"
                      ? "text-green-400"
                      : r.signal === "PUT"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {r.signal}
                </div>
                <div className="text-gray-400 text-[10px]">
                  AI {r.aiScore || 0}% | RSI {r.rsi || "-"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
              }
