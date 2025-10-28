// ✅ /pages/scanner.js — OriginX AI Super Scanner
import { useEffect, useState } from "react";

export default function Scanner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/ai-analyzer");
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, []);

  const renderBlock = (title, color, list) => (
    <div className="bg-[#0f172a]/60 rounded-xl p-3 mt-3 border border-gray-700 shadow">
      <div className={`flex items-center gap-2 mb-2 text-${color}-400 font-extrabold text-[17px]`}>
        <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
        {title}
      </div>
      {list?.length ? (
        <div className="flex flex-col divide-y divide-gray-800/40">
          {list.map((r, i) => (
            <a
              key={i}
              href={`/analyze/${r.symbol}`}
              className="flex justify-between py-1.5 hover:bg-[#111827]/50 rounded-md transition-all px-1"
            >
              <div className="text-white font-bold">{r.symbol}</div>
              <div className="text-right font-mono text-[13px] leading-tight">
                <div className="text-white">${r.price.toFixed(2)}</div>
                <div className="text-emerald-400">RSI {r.rsi.toFixed(0)}</div>
                <div className="text-gray-400">AI {r.aiConfidence}%</div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-[13px] italic">ไม่มีข้อมูล</div>
      )}
    </div>
  );

  if (loading) return <div className="text-center text-gray-400 py-10 italic">⏳ กำลังสแกน...</div>;

  return (
    <section className="w-full min-h-screen bg-[#0b1220] text-gray-100 px-3 pt-3 pb-10">
      <h1 className="text-[22px] font-extrabold text-emerald-400 flex items-center gap-2 mb-4">
        🚀 OriginX AI Super Scanner
      </h1>
      {renderBlock("ซื้อ (Strong Buy)", "green", data?.buys)}
      {renderBlock("ถือ (Neutral)", "yellow", data?.holds)}
      {renderBlock("ขาย (Weak)", "red", data?.sells)}
    </section>
  );
                }
