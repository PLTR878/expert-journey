// ✅ /components/ScannerSection.js — OriginX AI Super Scanner (v∞.53 Unified UI)
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
    addLog("🚀 Starting AI Scan...");
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
    <main className="min-h-screen bg-[#0b1220] text-white pb-20">
      {/* 🧠 Header */}
      <div className="text-center pt-6 pb-3">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">
          🚀 OriginX AI Super Scanner
        </h1>
        <p className="text-gray-400 text-sm">(Full Market Analysis)</p>
      </div>

      {/* 🔍 Run Scan Button */}
      <div className="max-w-sm mx-auto px-4 mb-4">
        <button
          onClick={runScan}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 py-2.5 rounded-xl font-bold transition text-white shadow-md"
        >
          {loading ? "⏳ Scanning..." : "🔍 Run Full Market Scan"}
        </button>
      </div>

      {/* ✅ Results */}
      <div className="max-w-3xl mx-auto px-3">
        {results.length > 0 ? (
          <>
            <div className="text-xs text-gray-400 text-center mb-2">
              ✅ Showing Top {results.length} AI Picks
            </div>

            <div className="grid grid-cols-1 gap-3">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center bg-[#111827] hover:bg-[#1f2937] p-3 rounded-2xl border border-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 rounded-md w-9 h-9 flex items-center justify-center text-[12px] font-bold text-white/80">
                      {r.symbol[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{r.symbol}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        💵 ${r.last?.toFixed?.(2) ?? "-"} | 📊 RSI {Math.round(r.rsi) || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold text-xs ${
                        r.signal === "Buy"
                          ? "text-green-400"
                          : r.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      🤖 {Math.round(r.aiScore)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm text-center py-10">
            {loading ? "กำลังสแกนตลาด..." : "กดปุ่มด้านบนเพื่อเริ่มสแกนทั้งตลาด"}
          </p>
        )}
      </div>

      {/* 🧠 Logs Section */}
      <section className="mt-8 max-w-3xl mx-auto px-3">
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
    </main>
  );
            }
