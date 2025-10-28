// ✅ /pages/scanner.js — OriginX AI Super Scanner (Connected to Visionary Batch v∞.49)
import { useState } from "react";

export default function Scanner() {
  const [batch, setBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-60), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ เตรียมจำนวน batch ทั้งหมด
  async function prepareScanner() {
    addLog("📦 Preparing symbol list...");
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const maxPerBatch = 300;
    const batches = Math.ceil(total / maxPerBatch);
    setTotalBatches(batches);
    addLog(`✅ Found ${total} symbols → ${batches} batches`);
  }

  // ✅ เรียกใช้ Visionary Batch (แทน market-scan เดิม)
  async function runBatch(batchNo) {
    try {
      const res = await fetch(`/api/visionary-batch?batch=${batchNo}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data?.results?.length) {
        setResults((p) => [...p, ...data.results]);
        addLog(`✅ Batch ${batchNo} done (${data.results.length} stocks)`);
      } else addLog(`⚠️ Batch ${batchNo} empty or filtered out`);
    } catch (e) {
      addLog(`❌ Batch ${batchNo} error: ${e.message}`);
    }
  }

  // ✅ สแกนทั้งตลาด
  async function runFullScan() {
    setLoading(true);
    setResults([]);
    await prepareScanner();

    for (let i = 1; i <= totalBatches; i++) {
      setBatch(i);
      addLog(`🚀 Scanning batch ${i}/${totalBatches}...`);
      await runBatch(i);
      await new Promise((r) => setTimeout(r, 200)); // ✅ ปลอด block + เร็วขึ้น
    }

    addLog("🏁 Market Scan Completed ✅");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white p-4 pb-20">
      <h2 className="text-xl font-bold text-center mb-4 text-emerald-400">
        🚀 OriginX AI Super Scanner (Full Market)
      </h2>

      <button
        onClick={runFullScan}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg font-bold transition mb-3"
      >
        {loading
          ? `⏳ Scanning... (Batch ${batch}/${totalBatches})`
          : "🔍 Run Full Market Scan"}
      </button>

      {results.length > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          ✅ Total: {results.length} | BUY:{" "}
          {results.filter((x) => x.signal === "Buy").length}
        </div>
      )}

      <div className="divide-y divide-gray-800/50">
        {results.map((r, i) => (
          <div key={i} className="flex justify-between py-2 text-sm">
            <span className="font-bold">{r.symbol}</span>
            <span
              className={`font-bold ${
                r.signal === "Buy"
                  ? "text-green-400"
                  : r.signal === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {r.signal}
            </span>
            <span className="text-gray-400">
              RSI {Math.round(r.rsi)} | AI {r.aiScore}
            </span>
          </div>
        ))}
      </div>

      {/* Logs Section */}
      <section className="mt-5">
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
