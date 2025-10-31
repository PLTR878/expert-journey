import { useState, useEffect } from "react";
import Link from "next/link";

export default function OptionXSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✅ โหลดผลเก่าจาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("optionScanResults");
    if (saved) setResults(JSON.parse(saved));
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
    let all = [];
    const delay = 200;

    for (let i = 1; i <= batches; i++) {
      const r = await runSingleBatch(i);
      if (r?.length) all.push(...r);
      setProgress(Math.round((i / batches) * 100));
      await new Promise((res) => setTimeout(res, delay));
    }

    const top = all
      .map((x) => ({
        ...x,
        optionSignal: x.rsi < 35 ? "CALL" : x.rsi > 70 ? "PUT" : "HOLD",
      }))
      .filter((x) => x.aiScore > 60)
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 20);

    // ✅ บันทึกถาวร
    localStorage.setItem("optionScanResults", JSON.stringify(top));
    setResults(top);
    setLoading(false);
    setProgress(100);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-2 relative">
        <div className="flex justify-between items-center mb-2 relative">
          <h1 className="text-[19px] font-extrabold text-pink-400 tracking-wide">
            💹 OptionX Terminal
          </h1>
          <button
            onClick={runFullScan}
            disabled={loading}
            className={`absolute right-0 top-0 px-5 py-[6px] rounded-md text-[13px] font-extrabold border border-gray-600 bg-transparent hover:bg-[#1f2937]/40 transition-all ${
              loading
                ? "text-gray-500"
                : "text-white hover:text-pink-400"
            }`}
            style={{ minWidth: "88px" }}
          >
            {loading ? `${progress}%` : "SCAN"}
          </button>
        </div>

        <section className="p-1">
          {results.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-800/50">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-[10px] hover:bg-[#111827]/30 transition-all"
                >
                  {/* ✅ โลโก้แน่นอน */}
                  <div className="flex items-center gap-2 min-w-[35%]">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#0b0f17] border border-gray-700 shrink-0">
                      <img
                        src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
                        alt={r.symbol}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://finnhub.io/api/logo?symbol=${r.symbol}`;
                          setTimeout(() => {
                            if (!e.target.complete || e.target.naturalWidth === 0) {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `<div class='w-full h-full bg-white flex items-center justify-center rounded-full border border-gray-300'>
                                <span class='text-black font-extrabold text-[9px] uppercase'>${r.symbol}</span>
                              </div>`;
                            }
                          }, 400);
                        }}
                      />
                    </div>
                    <div className="leading-tight">
                      <div className="font-extrabold text-[13.5px] text-white">
                        {r.symbol}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {r.companyName || "AI Option Signal"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono leading-tight min-w-[75px] space-y-[2px]">
                    <div className="text-[14px] font-extrabold text-white">
                      {r.last ? `$${r.last.toFixed(2)}` : "-"}
                    </div>
                    <div
                      className={`text-[12px] font-extrabold ${
                        r.optionSignal === "CALL"
                          ? "text-green-400"
                          : r.optionSignal === "PUT"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.optionSignal}
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
                กด “SCAN” เพื่อเริ่มสแกนออปชัน
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
}
