// ✅ /components/SettinMenu.js — Visionary AI Trade
import { useState } from "react";

export default function SettinMenu() {
  const [symbol, setSymbol] = useState("PLTR");
  const [prompt, setPrompt] = useState("แนวโน้มสัปดาห์นี้");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/ai-visionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, prompt }),
      });
      const j = await res.json();
      setData(j);
    } catch (err) {
      setData({ success: false, error: "❌ เชื่อมต่อไม่สำเร็จ" });
    }
    setLoading(false);
  };

  return (
    <section className="min-h-screen bg-[#0b1220] text-gray-100 p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-emerald-400 text-center">
          💹 Visionary AI Trade
        </h1>

        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="w-full bg-[#111827] border border-gray-700 p-2 rounded-md text-center font-bold"
          placeholder="เช่น PLTR"
        />

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-[#0f172a] border border-gray-700 rounded-md p-3 text-sm"
          placeholder="เช่น วิเคราะห์แนวโน้ม 7 วัน"
        />

        <button
          onClick={askAI}
          disabled={loading}
          className="w-full py-2 bg-emerald-500/80 hover:bg-emerald-500 rounded-md font-bold text-white"
        >
          {loading ? "⏳ กำลังวิเคราะห์..." : "⚡ ถาม Visionary AI"}
        </button>

        {data && (
          <div className="bg-[#111827] border border-gray-700 rounded-lg p-3 mt-4 text-sm whitespace-pre-line">
            {data.quote && (
              <div className="text-center text-emerald-400 font-bold mb-2">
                {data.quote.symbol} ราคา ${data.quote.price} ({data.quote.change}%)
              </div>
            )}
            <div>{data.result || data.error}</div>
          </div>
        )}
      </div>
    </section>
  );
            }
