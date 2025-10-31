// ✅ components/ScannerSection.js — สแกนทั้งตลาด + โหมดสลับ OriginX / OptionX
import { useState, useEffect } from "react";
import Link from "next/link";
import OptionXSection from "./OptionXSection";

export default function ScannerSection() {
  const [mode, setMode] = useState("originx"); // 🧠 OriginX หรือ 💹 OptionX
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ โหลดข้อมูลสแกนทั้งตลาด (แบบเดิม)
  async function loadMarket() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      setResults(j.results || []);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarket();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">

        {/* 🔘 หัวข้อ + ปุ่มสลับโหมด */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-[18px] font-extrabold text-emerald-400 tracking-wide">
            {mode === "originx"
              ? "🧠 OriginX — AI Stock Scanner"
              : "💹 OptionX — AI Reversal & Option Signal"}
          </h1>

          <button
            onClick={() => setMode(mode === "originx" ? "optionx" : "originx")}
            className="border border-emerald-400 text-emerald-300 bg-[#111827]/40 px-3 py-[6px] rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition"
          >
            {mode === "originx" ? "Switch → OptionX" : "Switch → OriginX"}
          </button>
        </div>

        {/* 🔄 แสดงตามโหมด */}
        {mode === "optionx" ? (
          <OptionXSection /> // โหมด OptionX (AI ออปชัน)
        ) : (
          <>
            {/* ปุ่ม SCAN */}
            <div className="flex justify-end mb-4">
              <button
                onClick={loadMarket}
                disabled={loading}
                className={`px-6 py-[6px] rounded-md border border-gray-500 bg-transparent text-sm font-extrabold ${
                  loading
                    ? "text-gray-500 cursor-wait"
                    : "text-white hover:text-emerald-400 hover:bg-[#1f2937]/40"
                }`}
              >
                {loading ? "Scanning..." : "SCAN"}
              </button>
            </div>

            {/* ตารางผลลัพธ์ OriginX */}
            <div className="divide-y divide-gray-800/40">
              {results.length === 0 && !loading && (
                <p className="text-center text-gray-500 italic py-10">
                  กด “SCAN” เพื่อเริ่มสแกนตลาด (OriginX)
                </p>
              )}

              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-2 hover:bg-[#111827]/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0b0f17] border border-gray-700 text-[11px] font-bold text-gray-300">
                      {r.symbol}
                    </div>
                    <div>
                      <div className="font-bold text-[13.5px]">{r.symbol}</div>
                      <div className="text-[11px] text-gray-400">{r.companyName}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[12px] leading-tight space-y-[2px]">
                    <div className="text-[13px] font-bold text-white">
                      ${r.last?.toFixed(2) || "-"}
                    </div>
                    <div
                      className={`font-bold ${
                        r.signal === "BUY"
                          ? "text-green-400"
                          : r.signal === "SELL"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal || "-"}
                    </div>
                    <div className="text-gray-400 text-[10px]">
                      AI {r.aiScore || 0}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
              }
