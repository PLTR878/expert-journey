// ✅ /components/ScannerSection.js — OriginX AI Super Scanner (v∞.64 No Logs + Full Batch Scan)
import { useState } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);

  // เตรียมจำนวน batch
  async function prepareScanner() {
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const perBatch = 300;
    const batches = Math.ceil(total / perBatch);
    setTotalBatches(batches);
    return batches;
  }

  // ดึงข้อมูลทีละ batch
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

  // ✅ สแกนเต็มตลาด แล้วโชว์ผลหลังจบเท่านั้น
  async function runFullScan() {
    setLoading(true);
    setResults([]);
    const batches = await prepareScanner();
    let allResults = [];
    const delay = 200;

    for (let i = 1; i <= batches; i++) {
      setBatch(i);
      const r = await runSingleBatch(i);
      if (r?.length) allResults.push(...r);
      await new Promise((res) => setTimeout(res, delay));
    }

    const top = allResults
      .filter((x) => x.signal === "Buy")
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 20);

    setResults(top);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">
        <section className="p-4">
          {/* หัวข้อ + ปุ่ม */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-emerald-400">
              📡 OriginX AI Super Scanner
            </h2>

            <button
              onClick={runFullScan}
              disabled={loading}
              className={`px-4 py-[8px] rounded-lg text-sm font-semibold border transition-all shadow-md ${
                loading
                  ? "bg-gray-700 border-gray-600 text-gray-400"
                  : "bg-emerald-500/90 border-emerald-400/50 text-white hover:bg-emerald-500"
              }`}
            >
              {loading
                ? `⏳ Scanning... (${batch}/${totalBatches})`
                : "🔍 Scan"}
            </button>
          </div>

          {/* รายการหุ้น */}
          {!loading && results.length > 0 ? (
            <>
              <div className="text-xs text-gray-400 mb-2 text-center">
                ✅ Showing Top {results.length} AI Picks
              </div>
              <div className="flex flex-col divide-y divide-gray-800/60">
                {results.map((r, i) => (
                  <Link
                    key={i}
                    href={`/analyze/${r.symbol}`}
                    className="flex items-center justify-between py-[10px] px-[4px] hover:bg-[#111827]/40 transition-all"
                  >
                    {/* โลโก้วงกลม */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
                          alt={r.symbol}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://finnhub.io/api/logo?symbol=${r.symbol}`;
                            setTimeout(() => {
                              if (
                                !e.target.complete ||
                                e.target.naturalWidth === 0
                              ) {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = `<div class='w-full h-full bg-white flex items-center justify-center rounded-full border border-gray-300'>
                                  <span class='text-black font-extrabold text-[11px] uppercase'>${r.symbol}</span>
                                </div>`;
                              }
                            }, 700);
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

                    {/* ด้านขวา */}
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
                        {r.rsi ? Math.round(r.rsi) : "-"}
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

                      <div className="text-[9px] text-gray-400 font-semibold scale-75">
                        AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : loading ? (
            <p className="text-center text-gray-500 italic py-10">
              ⏳ กำลังสแกนตลาดทั้งหมด...
            </p>
          ) : (
            <p className="text-center text-gray-500 italic py-5">
              กดปุ่ม 🔍 Scan เพื่อเริ่มสแกนตลาด
            </p>
          )}
        </section>
      </div>
    </main>
  );
                            }
