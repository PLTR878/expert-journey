// ✅ /components/SettinMenu.js — Visionary AI Trade
import { useState } from "react";

export default function SettinMenu() {
  const [symbol, setSymbol] = useState("PLTR");
  const [prompt, setPrompt] = useState("วิเคราะห์แนวโน้มวันนี้");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/ai-visionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, symbol }),
      });
      const j = await res.json();
      setData(j);
    } catch (err) {
      setData({ result: "❌ ไม่สามารถเชื่อมต่อได้" });
    } finally {
      setLoading(false);
    }
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
          className="w-full bg-[#111827] border border-gray-700 p-2 rounded-md text-center font-bold tracking-wide"
          placeholder="ใส่ชื่อหุ้น เช่น PLTR"
        />

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-[#0f172a] border border-gray-700 rounded-md p-3 text-sm"
          placeholder="ถาม AI เช่น แนวโน้มสัปดาห์หน้า / แนวรับแนวต้าน"
        />

        <button
          onClick={askAI}
          disabled={loading}
          className="w-full py-2 bg-emerald-500/80 hover:bg-emerald-500 rounded-md font-bold"
        >
          {loading ? "⏳ กำลังวิเคราะห์..." : "⚡ วิเคราะห์ด้วย Visionary AI"}
        </button>

        {data && (
          <div className="bg-[#111827] border border-gray-700 rounded-lg p-3 text-sm whitespace-pre-line mt-4">
            {data.quote ? (
              <>
                <div className="text-emerald-400 font-bold text-center mb-2">
                  {data.quote.name} (${data.quote.symbol})
                </div>
                <div className="text-center text-gray-300 text-sm mb-3">
                  ราคา ${data.quote.price} ({data.quote.change}%)
                </div>
              </>
            ) : null}
            <div>{data.result}</div>
          </div>
        )}
      </div>
    </section>
  );
          }
