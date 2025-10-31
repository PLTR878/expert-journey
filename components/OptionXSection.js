// ✅ components/OptionXSection.js — โหมด OptionX (AI Reversal / Option Signal)
import { useState, useEffect } from "react";
import Link from "next/link";

export default function OptionXSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // โหลดข้อมูลสแกนจาก Visionary API
  async function runOptionScan() {
    setLoading(true);
    setProgress(0);
    setResults([]);
    const totalBatches = 25; // สมมุติสแกน 7000 หุ้น / batch ละ 300
    let all = [];

    for (let i = 1; i <= totalBatches; i++) {
      const res = await fetch(`/api/visionary-batch?batch=${i}`, { cache: "no-store" });
      const j = await res.json();
      const data = j.results || [];
      if (data?.length) all.push(...data);
      setProgress(Math.round((i / totalBatches) * 100));
      await new Promise((r) => setTimeout(r, 200));
    }

    // วิเคราะห์ออปชัน CALL / PUT จาก RSI
    const analyzed = all.map((x) => {
      let signal = "NEUTRAL";
      if (x.rsi < 35) signal = "CALL";
      else if (x.rsi > 70) signal = "PUT";
      return { ...x, signal };
    });

    // เรียงตาม AI Score
    const top = analyzed
      .filter((x) => x.aiScore > 70)
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 20);

    setResults(top);
    setLoading(false);
    setProgress(100);
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-2 relative">
        {/* หัวข้อ */}
        <div className="flex justify-between items-center mb-2 relative">
          <h1 className="text-[19px] font-extrabold text-emerald-400 tracking-wide">
            💹 OptionX — AI Reversal Scanner
          </h1>
          <button
            onClick={runOptionScan}
            disabled={loading}
            className={`absolute right-0 top-0 px-5 py-[6px] rounded-md text-[13px] font-extrabold border border-gray-600 bg-transparent hover:bg-[#1f2937]/40 transition-all ${
              loading ? "text-gray-500" : "text-white hover:text-emerald-400"
            }`}
            style={{ minWidth: "88px" }}
          >
            {loading ? `${progress}%` : "SCAN"}
          </button>
        </div>

        {/* ตารางผลลัพธ์ */}
        <section className="p-1">
          {results.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-800/50">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-[10px] hover:bg-[#111827]/30 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-[35%]">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#0b0f17] border border-gray-700">
                      <span className="text-[10px] font-bold text-white">{r.symbol}</span>
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
                        r.signal === "CALL"
                          ? "text-green-400"
                          : r.signal === "PUT"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal}
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
    </div>
  );
          }
