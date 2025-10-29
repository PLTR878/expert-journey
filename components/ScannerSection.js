// ✅ /components/ScannerSection.js — OriginX AI Super Scanner (v∞.95 Ocean Blue Edition)
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✅ โหลดผลสแกนที่บันทึกไว้
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aiScanResults");
      if (saved) setResults(JSON.parse(saved));
    } catch (e) {
      console.warn("❌ Load saved results error:", e);
    }
  }, []);

  async function prepareScanner() {
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const perBatch = 300;
    return Math.ceil(total / perBatch);
  }

  async function runSingleBatch(batchNo) {
    try {
      const res = await fetch(`/api/visionary-batch?batch=${batchNo}`, {
        cache: "no-store",
      });
      const j = await res.json();
      return j?.results || [];
    } catch {
      return [];
    }
  }

  async function runFullScan() {
    setLoading(true);
    setProgress(0);
    setResults([]);
    const batches = await prepareScanner();
    let allResults = [];
    const delay = 200;

    for (let i = 1; i <= batches; i++) {
      const r = await runSingleBatch(i);
      if (r?.length) allResults.push(...r);
      setProgress(Math.round((i / batches) * 100));
      await new Promise((res) => setTimeout(res, delay));
    }

    const top = allResults
      .filter((x) => x.signal === "Buy")
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 20);

    setResults(top);
    localStorage.setItem("aiScanResults", JSON.stringify(top));
    setLoading(false);
    setProgress(100);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">
        <section className="p-3">
          {/* หัวข้อ + ปุ่ม */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-1">
              📡 OriginX AI Super Scanner
            </h2>
            <button
              onClick={runFullScan}
              disabled={loading}
              className={`px-4 py-[5px] rounded-md text-sm font-semibold border transition-all ${
                loading
                  ? "bg-transparent border-gray-600 text-gray-400"
                  : "bg-transparent border-gray-600 text-gray-300 hover:bg-[#1a2433]/40"
              }`}
            >
              {loading ? `⏳ ${progress}%` : "🔍 Scan"}
            </button>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="w-full h-[5px] bg-[#111827] rounded-full overflow-hidden mb-4">
              <div
                className="h-[5px] bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* รายการหุ้น */}
          {!loading && results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-[9px] hover:bg-[#111827]/40 transition-all"
                >
                  {/* ซ้าย: โลโก้ + ชื่อหุ้น */}
                  <div className="flex items-center gap-2 min-w-[45%]">
                    <div className="w-8 h-8 rounded-full bg-[#0d1322] flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
                        alt={r.symbol}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class='w-full h-full bg-white flex items-center justify-center rounded-full'>
                            <span class='text-black font-extrabold text-[10px] uppercase'>${r.symbol}</span>
                          </div>`;
                        }}
                      />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-[14px] text-white">
                        {r.symbol}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {r.companyName || "AI Discovery"}
                      </div>
                    </div>
                  </div>

                  {/* ขวา: ราคา / RSI / Buy / AI */}
                  <div className="flex flex-col text-right items-end min-w-[80px] leading-tight">
                    <div className="text-[14px] font-black text-white">
                      {r.last ? `$${r.last.toFixed(2)}` : "-"}
                    </div>
                    <div
                      className={`text-[12px] font-bold ${
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
                      className={`text-[12px] font-extrabold ${
                        r.signal === "Buy"
                          ? "text-green-400"
                          : r.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal || "-"}
                    </div>
                    <div className="text-[9.5px] text-gray-400 mt-[1px]">
                      AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-center text-gray-500 italic py-6">
                🔍 กดปุ่ม Scan เพื่อเริ่มสแกนตลาด
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
                }
