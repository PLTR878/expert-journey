// ✅ /components/ScannerSection.js — OriginX AI Super Scanner (v∞.58 Pure Style)
import { useState } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-80), `${new Date().toLocaleTimeString()} ${msg}`]);

  async function runFullScan() {
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
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">
        <section className="p-4">
          {/* หัวข้อ + ปุ่ม */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-emerald-400">
              🚀 OriginX AI Super Scanner
            </h2>

            <button
              onClick={runFullScan}
              disabled={loading}
              className={`px-4 py-[6px] rounded-lg text-sm font-semibold border transition-all shadow-md ${
                loading
                  ? "bg-gray-700 border-gray-600 text-gray-400"
                  : "bg-emerald-500/90 border-emerald-400/50 text-white hover:bg-emerald-500"
              }`}
            >
              {loading ? "⏳ Scanning..." : "🔍 Scan"}
            </button>
          </div>

          {/* รายการหุ้นแนวตั้ง */}
          {results.length > 0 ? (
            <>
              <div className="text-xs text-gray-400 mb-2 text-center">
                ✅ Showing Top {results.length} AI Picks
              </div>

              <div className="flex flex-col divide-y divide-gray-800/60">
                {results.map((r, i) => (
                  <Link
                    key={i}
                    href={`/analyze/${r.symbol}`}
                    className="flex items-center justify-between py-[10px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                  >
                    {/* โลโก้วงกลม + ชื่อหุ้น */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
                          alt={r.symbol}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `<div class='w-full h-full bg-white flex items-center justify-center rounded-full border border-gray-300'>
                              <span class='text-black font-extrabold text-[11px] uppercase'>${r.symbol}</span>
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

                    {/* ราคา / RSI / Signal / AI เป็นแนวตั้ง */}
                    <div className="text-right leading-tight font-mono min-w-[70px]">
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
                      <div className="text-[12px] text-gray-400 font-semibold">
                        AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 italic py-5">
              {loading ? "⏳ กำลังสแกนตลาดทั้งหมด..." : "กดปุ่ม 🔍 Scan เพื่อเริ่มสแกนตลาด"}
            </p>
          )}

          {/* Logs */}
          <section className="mt-8">
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
      </div>
    </main>
  );
                            }
