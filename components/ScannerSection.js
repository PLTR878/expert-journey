import { useState, useEffect } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(1);
  const [progress, setProgress] = useState(0);

  // ✅ โหลดผลสแกนเก่าจาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("aiScanResults");
    if (saved) setResults(JSON.parse(saved));
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

  // ✅ สแกนตลาดทั้งหมด + แสดงเปอร์เซ็นต์ความคืบหน้า
  async function runFullScan() {
    setLoading(true);
    setResults([]);
    const batches = await prepareScanner();
    let allResults = [];
    const delay = 200;

    for (let i = 1; i <= batches; i++) {
      setBatch(i);
      setProgress(Math.round((i / batches) * 100));
      const r = await runSingleBatch(i);
      if (r?.length) allResults.push(...r);
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
          {/* ปุ่ม Scan (โปร่งใส เรียบหรู) */}
          <div className="flex justify-end mb-4">
            <button
              onClick={runFullScan}
              disabled={loading}
              className={`px-4 py-[6px] rounded-md text-sm font-semibold border border-gray-600 bg-transparent hover:bg-[#1f2937]/40 transition-all ${
                loading ? "text-gray-500" : "text-white hover:text-emerald-400"
              }`}
            >
              {loading ? `${progress}%` : "Scan"}
            </button>
          </div>

          {/* แถบโหลด (เส้นโปร่งใสเหมือน UI ระดับโปร) */}
          {loading && (
            <div className="w-full h-[2px] bg-white/10 rounded-full mb-3 overflow-hidden">
              <div
                className="h-[2px] bg-emerald-400/60 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* รายการหุ้น */}
          {results.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-800/50">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-[10px] hover:bg-[#111827]/30 transition-all"
                >
                  {/* ซ้าย: โลโก้ + ชื่อหุ้น */}
                  <div className="flex items-center gap-2 min-w-[40%]">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#0b0f17] border border-gray-700">
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
                          }, 600);
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

                  {/* ขวา: ราคา / RSI / Signal / AI */}
                  <div className="text-right font-mono leading-tight min-w-[75px] space-y-[2px]">
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
                    <div className="text-[9px] text-gray-400 font-semibold">
                      AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-center text-gray-500 italic py-6">
                กด “Scan” เพื่อเริ่มการสแกนตลาด
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
    }
