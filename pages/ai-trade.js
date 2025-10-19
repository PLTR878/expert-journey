// 🤖 Visionary AI Trade — Self-Discovering AI V∞.X.1
import { useEffect, useState } from "react";

export default function AiTrade() {
  const [aiPicks, setAiPicks] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [scan, disc] = await Promise.all([
        fetch("/api/visionary-eternal?type=ai-scan").then((r) => r.json()),
        fetch("/api/visionary-eternal?type=ai-discovery").then((r) => r.json()),
      ]);
      setAiPicks(scan.aiPicks || []);
      setDiscover(disc.discovered || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="px-3 py-4 text-emerald-400 text-[18px] font-bold">
        🤖 AI Super Investor — Self-Discovering Picks
      </header>

      <div className="max-w-6xl mx-auto px-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">
            AI กำลังสแกนตลาดทั่วโลก...
          </div>
        ) : (
          <>
            <h3 className="text-emerald-400 font-bold text-[16px] mb-2">
              🔮 Top AI Picks
            </h3>
            {aiPicks.map((r) => (
              <StockRow key={r.symbol} r={r} />
            ))}

            <h3 className="text-blue-400 font-bold text-[16px] mt-6 mb-2">
              🧬 Newly Discovered
            </h3>
            {discover.map((r) => (
              <StockRow key={r.symbol} r={r} />
            ))}
          </>
        )}
      </div>
    </main>
  );
}

function StockRow({ r }) {
  return (
    <div className="flex items-center justify-between py-[10px] px-[4px] hover:bg-[#111827]/40 transition-all border-b border-gray-800/50">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden bg-[#1e293b]">
          <img
            src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
            alt={r.symbol}
            className="w-8 h-8 object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
        <div>
          <div className="text-white font-semibold text-[14px]">{r.symbol}</div>
          <div className="text-[11px] text-gray-400">
            {r.reason || "AI-Selected Uptrend"}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 font-mono pr-3">
        <span className="text-gray-200 text-[13px]">${r.lastClose?.toFixed(2)}</span>
        <span
          className={`text-[13px] ${
            r.rsi > 70
              ? "text-red-400"
              : r.rsi < 40
              ? "text-blue-400"
              : "text-emerald-400"
          }`}
        >
          {Math.round(r.rsi)}
        </span>
        <span className="text-[13px] font-bold text-green-400">
          {r.trend === "Uptrend" ? "Buy" : "Hold"}
        </span>
      </div>
    </div>
  );
    }
