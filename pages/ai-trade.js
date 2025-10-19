import { useEffect, useState } from "react";

export default function AiTrade() {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/visionary-eternal?type=ai-discovery");
      const j = await res.json();
      setStocks(j.discovered || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white px-4 py-6">
      <h1 className="text-emerald-400 font-bold text-xl mb-4">
        🤖 Visionary AI — Future Leaders
      </h1>

      {loading ? (
        <p className="text-gray-400">AI กำลังสแกนตลาดทั่วโลก...</p>
      ) : (
        <div className="space-y-3">
          {stocks.map((s) => (
            <div
              key={s.symbol}
              className="flex justify-between items-center border-b border-gray-700 py-3 hover:bg-[#111827]/50 rounded-lg transition-all"
            >
              <div>
                <div className="text-[16px] font-bold">{s.symbol}</div>
                <div className="text-[12px] text-gray-400">{s.reason}</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-mono text-[14px]">
                  ${s.lastClose?.toFixed(2)}
                </div>
                <div className="text-[12px] text-gray-400">
                  RSI: {s.rsi} | Sentiment: {s.sentiment}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
                      }
