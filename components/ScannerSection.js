// ✅ /components/ScannerSection.js — OriginX AI Super Scanner (v∞.55 Refined)
import { useState } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-60), `${new Date().toLocaleTimeString()} ${msg}`]);

  async function runScan() {
    setLoading(true);
    setResults([]);
    addLog("🚀 Starting AI Market Scan...");
    try {
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const data = await res.json();
      setResults(data.results || []);
      addLog(`✅ Found ${data.results?.length || 0} stocks`);
    } catch (e) {
      addLog(`❌ Error: ${e.message}`);
    }
    setLoading(false);
  }

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* 🔰 Header */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          🚀 OriginX AI Super Scanner
        </h2>

        {/* ปุ่มสแกนเล็ก เรียบหรู */}
        <button
          onClick={runScan}
          disabled={loading}
          className="text-[12px] px-3 py-[5px] rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white font-semibold shadow-md border border-emerald-400/40 transition-all"
        >
          {loading ? "⏳ Scanning..." : "🔍 Scan"}
        </button>
      </div>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {results.length > 0 ? (
          results.map((r, i) => (
            <Link
              key={i}
              href={`/analyze/${r.symbol}`}
              className="flex items-center justify-between py-[10px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all rounded-lg"
            >
              {/* โลโก้ + Symbol */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
                    alt={r.symbol}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `<div class='w-full h-full bg-white flex flex-col items-center justify-center rounded-full border border-gray-300'>
                        <span class='text-black font-extrabold text-[11px] uppercase mt-[3px]'>${r.symbol}</span>
                      </div>`;
                    }}
                  />
                </div>
                <div>
                  <span className="text-white hover:text-emerald-400 font-extrabold text-[15px]">
                    {r.symbol}
                  </span>
                  <div className="text-[11px] text-gray-400 font-medium truncate max-w-[160px] leading-snug">
                    {r.companyName || "AI Discovery Candidate"}
                  </div>
                </div>
              </div>

              {/* ราคา + RSI + AI */}
              <div className="text-right leading-tight font-mono min-w-[75px]">
                <div className="text-[15px] text-white font-black">
                  {r.last ? `$${r.last.toFixed(2)}` : "-"}
                </div>
                <div
                  className={`text-[13px] font-bold ${
                    r.rsi > 70
                      ? "text-red-400"
                      : r.rsi < 40
                      ? "text-blue-400"
                      : "text-emerald-400"
                  }`}
                >
                  RSI {r.rsi ? Math.round(r.rsi) : "-"}
                </div>
                <div
                  className={`text-[13px] font-extrabold ${
                    r.signal === "Buy"
                      ? "text-green-400"
                      : r.signal === "Sell"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {r.signal || "-"}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-6 text-center text-gray-500 italic">
            {loading ? "กำลังสแกนตลาด..." : "กดปุ่ม 🔍 Scan เพื่อเริ่มการสแกนตลาดทั้งหมด"}
          </div>
        )}
      </div>

      {/* 🧠 Logs Section */}
      <section className="mt-8 px-2 sm:px-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-emerald-400 text-xs">🧠 Logs</span>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        </div>
        <div className="bg-black/30 border border-white/10 p-2 rounded-md text-xs text-gray-400 max-h-44 overflow-auto">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </section>
    </section>
  );
                }
