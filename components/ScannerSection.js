// ✅ /components/ScannerSection.js — OriginX Scanner Section
import { useState } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-40), `${new Date().toLocaleTimeString()} ${msg}`]);

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
    <section className="bg-[#0b1220] p-4 rounded-2xl border border-white/10 text-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-emerald-400">
          🚀 AI Super Scanner (Full Market)
        </h2>
        <button
          onClick={runScan}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-xs px-3 py-1 rounded-lg font-semibold transition"
        >
          {loading ? "⏳ Scanning..." : "🔍 Run Scan"}
        </button>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {results.map((r, i) => (
            <Link
              key={i}
              href={`/analyze/${r.symbol}`}
              className="flex items-center gap-3 p-3 bg-[#111827] hover:bg-[#1f2937] border border-white/5 rounded-xl transition"
            >
              <img
                src={`https://finnhub.io/api/logo?symbol=${r.symbol}`}
                alt={r.symbol}
                className="w-8 h-8 rounded-md bg-white/10"
                onError={(e) => (e.target.style.display = 'none')}
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-white text-sm">{r.symbol}</span>
                  <span
                    className={`font-bold text-xs ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 flex justify-between mt-1">
                  <span>💵 ${r.last}</span>
                  <span>📊 RSI {Math.round(r.rsi)}</span>
                  <span>🤖 {Math.round(r.aiScore)}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">
          {loading ? "กำลังสแกนตลาด..." : "กดปุ่มด้านบนเพื่อเริ่มสแกน"}
        </p>
      )}

      {/* Logs */}
      <div className="bg-black/30 mt-4 border border-white/10 rounded-md p-2 text-xs text-gray-400 max-h-36 overflow-auto">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </section>
  );
    }
