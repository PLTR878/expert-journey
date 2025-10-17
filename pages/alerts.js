import { useState } from "react";

export default function AlertsPage() {
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState([]);
  const [running, setRunning] = useState(false);
  const [latestSymbol, setLatestSymbol] = useState("");
  const [mode, setMode] = useState("Buy");
  const [rsiMin, setRsiMin] = useState("35");
  const [rsiMax, setRsiMax] = useState("55");
  const [priceMin, setPriceMin] = useState("1");
  const [priceMax, setPriceMax] = useState("30");

  // 🔔 เสียงเตือน
  function playAlertSound() {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play().catch(() => {});
  }

  async function runAutoScan() {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setMatches([]);
    setLatestSymbol("");

    let cursor = 0;
    const params = new URLSearchParams({
      mode,
      rsiMin,
      rsiMax,
      priceMin,
      priceMax,
    });

    while (true) {
      const res = await fetch(`/api/scan?${params}&cursor=${cursor}`);
      const j = await res.json();

      if (!j?.ok) break;

      if (j.matches?.length) {
        setMatches((prev) => [...prev, ...j.matches]);
        playAlertSound();
      }

      setProgress(j.progress);
      cursor = j.nextCursor ?? 0;
      setLatestSymbol(`Batch ${cursor / 10}`);

      if (j.done) {
        setRunning(false);
        break;
      }

      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return (
    <div className="p-4 text-white bg-[#0b0f17] min-h-screen">
      <h1 className="text-xl font-bold mb-3">🚀 Auto Scan — US Stocks</h1>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label>Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-[#1f2937] text-white p-2 rounded"
          >
            <option>Buy</option>
            <option>Sell</option>
            <option>Any</option>
          </select>
        </div>
        <div>
          <label>RSI Min</label>
          <input
            value={rsiMin}
            onChange={(e) => setRsiMin(e.target.value)}
            className="w-full bg-[#1f2937] p-2 rounded"
          />
        </div>
        <div>
          <label>RSI Max</label>
          <input
            value={rsiMax}
            onChange={(e) => setRsiMax(e.target.value)}
            className="w-full bg-[#1f2937] p-2 rounded"
          />
        </div>
        <div>
          <label>Price Min</label>
          <input
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full bg-[#1f2937] p-2 rounded"
          />
        </div>
        <div>
          <label>Price Max</label>
          <input
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full bg-[#1f2937] p-2 rounded"
          />
        </div>
      </div>

      <button
        onClick={runAutoScan}
        disabled={running}
        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2 mt-3 font-bold"
      >
        ▶ Run Now
      </button>

      <div className="mt-3 text-sm text-gray-300">
        Scanning... {progress}% {latestSymbol}
      </div>

      <div className="h-2 bg-black/40 rounded-full overflow-hidden mt-1">
        <div
          className="h-2 bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-3 text-xs text-gray-300 space-y-1 max-h-64 overflow-auto bg-black/30 rounded-lg p-2">
        {matches.map((m) => (
          <li key={m.symbol}>
            ✅ {m.symbol} — ${m.price.toFixed(2)} | RSI {m.rsi} | {m.signal}
          </li>
        ))}
      </ul>
    </div>
  );
              }
