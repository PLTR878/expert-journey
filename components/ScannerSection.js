// ✅ components/ScannerSection.js — Dual Mode Scanner (OriginX + OptionX)
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ScannerSection() {
  const [mode, setMode] = useState("originx"); // originx หรือ optionx
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // โหลดข้อมูลหุ้น (โหมด OriginX เดิม)
  async function runOriginXScan() {
    setLoading(true);
    setProgress(0);
    const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
    const j = await res.json();
    setResults(j.results || []);
    setProgress(100);
    setLoading(false);
  }

  // จำลองข้อมูล OptionX Reversal (ใหม่)
  async function runOptionXScan() {
    setLoading(true);
    setProgress(0);
    const mock = [
      { symbol: "PLUG", companyName: "Plug Power", last: 3.12, signal: "CALL", rsi: 41, aiScore: 91 },
      { symbol: "TSLA", companyName: "Tesla Inc", last: 214.2, signal: "PUT", rsi: 74, aiScore: 86 },
      { symbol: "NVDA", companyName: "NVIDIA", last: 96.4, signal: "NEUTRAL", rsi: 56, aiScore: 68 },
    ];
    await new Promise((r) => setTimeout(r, 800)); // mock delay
    setResults(mock);
    setProgress(100);
    setLoading(false);
  }

  // ฟังก์ชันสแกนตามโหมดที่เลือก
  async function handleScan() {
    if (mode === "originx") await runOriginXScan();
    else await runOptionXScan();
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-2 relative">

        {/* ✅ หัวข้อ */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-[18px] font-extrabold text-emerald-400 tracking-wide">
            {mode === "originx" ? "🧠 OriginX AI Discovery" : "💹 OptionX Reversal Engine"}
          </h1>

          {/* ✅ ปุ่มสลับโหมด */}
          <button
            onClick={() => setMode(mode === "originx" ? "optionx" : "originx")}
            className="border border-emerald-400 text-emerald-300 bg-[#111827]/40 px-3 py-[6px] rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition"
          >
            {mode === "originx" ? "Switch → OptionX" : "Switch → OriginX"}
          </button>
        </div>

        {/* ✅ ปุ่ม SCAN */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleScan}
            disabled={loading}
            className={`px-6 py-[6px] rounded-md border border-gray-500 bg-transparent text-sm font-extrabold ${
              loading
                ? "text-gray-500 cursor-wait"
                : "text-white hover:text-emerald-400 hover:bg-[#1f2937]/40"
            }`}
          >
            {loading ? `${progress}%` : "SCAN"}
          </button>
        </div>

        {/* ✅ ตารางผลลัพธ์ */}
        <div className="p-1">
          {results.length === 0 && !loading && (
            <p className="text-center text-gray-500 italic py-10">
              กด “SCAN” เพื่อเริ่มการสแกน {mode === "originx" ? "หุ้นต้นน้ำ" : "สัญญาณออปชัน"}
            </p>
          )}

          {results.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-800/40">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-2 hover:bg-[#111827]/30 transition"
                >
                  {/* ซ้าย */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0b0f17] border border-gray-700 text-[11px] font-bold text-gray-300">
                      {r.symbol}
                    </div>
                    <div>
                      <div className="font-bold text-[13.5px]">{r.symbol}</div>
                      <div className="text-[11px] text-gray-400">{r.companyName || "AI Signal"}</div>
                    </div>
                  </div>

                  {/* ขวา */}
                  <div className="text-right font-mono text-[12px] leading-tight space-y-[2px]">
                    <div className="text-[13px] font-bold text-white">${r.last?.toFixed(2) || "-"}</div>
                    <div
                      className={`font-bold ${
                        r.signal === "BUY" || r.signal === "CALL"
                          ? "text-green-400"
                          : r.signal === "SELL" || r.signal === "PUT"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal || "-"}
                    </div>
                    <div className="text-gray-400 text-[10px]">AI {r.aiScore || 0}%</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
                                   }
