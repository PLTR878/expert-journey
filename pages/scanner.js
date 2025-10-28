// ✅ /pages/scanner.js — OriginX AI Super Scanner v∞.51 (Logo + Click + Vertical Layout)
import { useState } from "react";
import Link from "next/link";

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

  // ✅ เรียกใช้ Visionary Batch
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
      await new Promise((r) => setTimeout(r, 200));
    }

    addLog("🏁 Market Scan Completed ✅");
    setLoading(false);
  }

  // ✅ UI
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
        <div className="text-xs text-gray-400 mb-3 text-center">
          ✅ Total: {results.length} | BUY:{" "}
          {results.filter((x) => x.signal === "Buy").length}
        </div>
      )}

      {/* ✅ รายชื่อหุ้นแนวตั้งแบบมีโลโก้ */}
      <div className="grid grid-cols-1 gap-2">
        {results.map((r, i) => (
          <Link
            key={i}
            href={`/analyze/${r.symbol}`}
            className="bg-[#111827] hover:bg-[#1f2937] transition p-3 rounded-xl border border-white/5 flex items-center gap-3"
          >
            {/* โลโก้บริษัท (favicon style) */}
            <img
              src={`https://finnhub.io/api/logo?symbol=${r.symbol}`}
              alt={r.symbol}
              className="w-8 h-8 rounded-md bg-white/10"
              onError={(e) => (e.target.style.display = "none")}
            />

            {/* ข้อมูลหุ้นแนวตั้ง */}
            <div className="flex-1">
              <div className="flex justify-between items-center">
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

              <div className="text-[11px] text-gray-400 mt-1 flex justify-between">
                <span>💵 Price: ${r.last}</span>
                <span>📊 RSI: {Math.round(r.rsi)}</span>
                <span>🤖 AI: {Math.round(r.aiScore)}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 🧠 Logs Section */}
      <section className="mt-6">
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
