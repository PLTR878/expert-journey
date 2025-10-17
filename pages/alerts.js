// ✅ /pages/alerts.js
// สแกนต่ออัตโนมัติ 800 หุ้นต่อรอบ มีเสียงเตือน + แถบเปอร์เซ็นต์

import { useState } from "react";

export default function AlertsPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState([]);
  const [batch, setBatch] = useState(1);

  function playSound(type) {
    const sounds = {
      Buy: "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
      Sell: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
      Done: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
    };
    const audio = new Audio(sounds[type] || sounds.Buy);
    audio.play().catch(() => {});
  }

  async function runScan() {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setMatches([]);
    setBatch(1);

    let cursor = 0;
    while (true) {
      const res = await fetch(`/api/scan?cursor=${cursor}&rsiMin=35&rsiMax=55&priceMin=1&priceMax=50`);
      const j = await res.json();

      if (!j.ok) break;

      if (j.matches?.length) {
        setMatches((prev) => [...prev, ...j.matches]);
        j.matches.forEach((m) => playSound(m.signal));
      }

      setProgress(j.progress);
      setBatch(Math.ceil(cursor / 800) + 1);
      cursor = j.nextCursor ?? 0;

      if (j.done) {
        playSound("Done");
        setRunning(false);
        break;
      }

      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return (
    <div className="p-4 text-white bg-[#0b0f17] min-h-screen">
      <h1 className="text-xl font-bold mb-3">🚀 Auto Scan — US Stocks (Full)</h1>

      <button
        onClick={runScan}
        disabled={running}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2"
      >
        ▶ Run Now
      </button>

      <div className="mt-3 text-sm text-gray-300">
        Scanning... {progress}% | Batch {batch}
      </div>

      <div className="h-2 bg-black/40 rounded-full overflow-hidden mt-1">
        <div
          className="h-2 bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-3 text-xs text-gray-300 space-y-1 max-h-64 overflow-auto bg-black/30 rounded-lg p-2">
        {matches.map((m, i) => (
          <li key={i}>
            ✅ {m.symbol} — ${m.price.toFixed(2)} | RSI {m.rsi} | {m.signal}
          </li>
        ))}
      </ul>

      {!running && progress === 100 && (
        <div className="text-green-400 mt-3">✅ สแกนครบทั้งตลาดแล้ว</div>
      )}
    </div>
  );
}
