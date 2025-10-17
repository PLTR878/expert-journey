// ✅ /pages/alerts.js
import { useState } from "react";

export default function AlertsPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState([]);
  const [log, setLog] = useState([]);

  async function playSound() {
    const audio = new Audio("/ding.mp3");
    await audio.play().catch(() => {});
  }

  async function scanBatch(cursor = 0) {
    const res = await fetch(`/api/scan?cursor=${cursor}`);
    const data = await res.json();

    if (!data.ok) throw new Error("Scan failed");

    setProgress(data.progress);
    setLog((prev) => [
      ...prev,
      `🚀 Batch ${cursor / 800 + 1}: ${data.batchSize} symbols | ${data.message}`,
    ]);

    // เรียก Yahoo API ฟรีเช็ค RSI / ราคา (จำลอง)
    for (const symbol of data.symbols) {
      try {
        const yRes = await fetch(
          `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
        );
        const yData = await yRes.json();
        const meta = yData?.chart?.result?.[0]?.meta;
        if (!meta) continue;

        const price = meta.regularMarketPrice || 0;
        const change = meta.regularMarketChangePercent || 0;
        const rsi = Math.floor(Math.random() * 40) + 30; // จำลอง RSI
        const signal =
          rsi > 60 ? "BUY" : rsi < 40 ? "SELL" : "HOLD";

        if (signal === "BUY") {
          setMatches((prev) => [
            ...prev,
            { symbol, price, rsi, signal },
          ]);
          await playSound();
        }
      } catch (err) {
        console.log("Yahoo fetch fail", symbol);
      }
    }

    if (!data.done) {
      await scanBatch(data.nextCursor);
    } else {
      setRunning(false);
      setLog((prev) => [...prev, "✅ สแกนครบทุกตัวแล้ว"]);
      await playSound();
    }
  }

  const runAutoScan = async () => {
    setRunning(true);
    setMatches([]);
    setLog(["🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..."]);
    await scanBatch(0);
  };

  return (
    <div className="p-4 text-white bg-[#0b0f17] min-h-screen">
      <h2 className="text-xl font-bold text-emerald-400 mb-2">
        🛰️ Auto Scan — US Stocks
      </h2>

      <button
        onClick={runAutoScan}
        disabled={running}
        className={`${
          running ? "bg-gray-600" : "bg-emerald-600 hover:bg-emerald-700"
        } text-white rounded-lg px-4 py-2`}
      >
        ▶ Run Now
      </button>

      <div className="mt-3">
        <div className="text-sm text-gray-300">
          Scanning... {progress}%
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden mt-1">
          <div
            className="h-2 bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="mt-3 text-xs text-gray-300 space-y-1 max-h-64 overflow-auto bg-black/30 rounded-lg p-2">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>

      <h3 className="text-emerald-400 mt-4 mb-1 font-semibold">
        ✅ Latest Matches ({matches.length})
      </h3>
      <ul className="text-sm space-y-1 bg-black/30 rounded-lg p-2">
        {matches.map((m) => (
          <li key={m.symbol}>
            ✅ {m.symbol} — ${m.price.toFixed(2)} | RSI {m.rsi} | {m.signal}
          </li>
        ))}
      </ul>
    </div>
  );
          }
