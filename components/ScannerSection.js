// ✅ /components/ScannerSection.js — OriginX AI Super Scanner (v∞.72 Persistent + Compact UI)
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);

  // ✅ โหลดผลสแกนที่บันทึกไว้
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aiScanResults");
      if (saved) setResults(JSON.parse(saved));
    } catch (e) {
      console.warn("❌ Load saved results error:", e);
    }
  }, []);

  // ✅ เตรียมจำนวน batch
  async function prepareScanner() {
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const perBatch = 300;
    const batches = Math.ceil(total / perBatch);
    setTotalBatches(batches);
    return batches;
  }

  // ✅ ดึงข้อมูลทีละ batch
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

  // ✅ สแกนเต็มตลาด และบันทึกถาวร
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
    localStorage.setItem("aiScanResults", JSON.stringify(top)); // ✅ บันทึกถาวร
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">
        <section className="p-3">
          {/* หัวข้อ + ปุ่ม */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-1">
              📡 OriginX AI Super Scanner
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
              {loading
                ? `⏳ Scanning... (${batch}/${totalBatches})`
                : "🔍 Scan"}
            </button>
          </div>

          {/* สถานะโหลด */}
          {loading && (
            <p className="text-center text-gray-400 text-sm my-6">
              ⏳ กำลังสแกนตลาดทั้งหมด...
            </p>
          )}

          {/* รายการหุ้น */}
          {!loading && results.length > 0 ? (
            <>
              <div className="text-xs text-gray-400 mb-2 text-center">
                ✅ Showing Top {results.length} AI Picks (Saved)
              </div>
              <div className="flex flex-col divide-y divide-gray-800/50">
                {results.map((r, i) => (
                  <Link
                    key={i}
                    href={`/analyze/${r.symbol}`}
                    className="flex justify-between items-center py-[8px] hover:bg-[#111827]/40 transition-all"
                  >
                    {/* โลโก้ + ชื่อหุ้น */}
                    <div className="flex items-center gap-2 min-w-[40%]">
                      <div className="w-8 h-8 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden shrink-0">
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
                                  <span class='text-black font-extrabold text-[10px] uppercase'>${r.symbol}</span>
                                </div>`;
                              }
                            }, 700);
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

                    {/* ขวา: ราคา / RSI / สัญญาณ / AI */}
                    <div className="text-right font-mono leading-tight space-y-[2px] min-w-[70px]">
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
                        {r.rsi ? Math.round(r.rsi) : "-"}
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
                      <div className="text-[9px] text-gray-400 scale-75">
                        AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
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
