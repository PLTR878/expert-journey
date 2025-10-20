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

  // ✅ เชื่อมต่อกับ Visionary Eternal API
  async function scanBatch(batch = 1) {
    try {
      const res = await fetch(`/api/visionary-eternal?type=ai-batchscan&batch=${batch}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // บันทึก log ความคืบหน้า
      setProgress(((batch / 25) * 100).toFixed(1)); // แสดง % คร่าว ๆ
      setLog((prev) => [
        ...prev,
        `🚀 Batch ${batch}: วิเคราะห์ ${data.analyzed} ตัว | พบ ${data.found} ตัวที่น่าสนใจ`,
      ]);

      // รวมหุ้นที่ AI พบ
      if (data.top?.length) {
        setMatches((prev) => [...prev, ...data.top]);
        await playSound();
      }

      // ถ้ายังมี batch ถัดไป ให้สแกนต่อ
      if (data.nextBatch) {
        await scanBatch(data.nextBatch);
      } else {
        setRunning(false);
        setLog((prev) => [...prev, "✅ สแกนครบทุกตัวแล้ว!"]);
        await playSound();
      }
    } catch (err) {
      setLog((prev) => [...prev, `❌ Error: ${err.message}`]);
      setRunning(false);
    }
  }

  const runAutoScan = async () => {
    setRunning(true);
    setMatches([]);
    setLog(["🧠 เริ่มสแกนหุ้นทั้งตลาดด้วย AI..."]);
    await scanBatch(1);
  };

  return (
    <div className="p-4 text-white bg-[#0b0f17] min-h-screen">
      <h2 className="text-xl font-bold text-emerald-400 mb-2">
        🛰️ Auto Scan — US Stocks (AI Batchscan)
      </h2>

      <button
        onClick={runAutoScan}
        disabled={running}
        className={`${
          running ? "bg-gray-600" : "bg-emerald-600 hover:bg-emerald-700"
        } text-white rounded-lg px-4 py-2`}
      >
        {running ? "⏳ Scanning..." : "▶ Run Now"}
      </button>

      <div className="mt-3">
        <div className="text-sm text-gray-300">Progress: {progress}%</div>
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
        ✅ หุ้นที่ AI พบ ({matches.length})
      </h3>
      <ul className="text-sm space-y-1 bg-black/30 rounded-lg p-2">
        {matches.map((m) => (
          <li key={m.symbol}>
            ✅ {m.symbol} — ${m.price?.toFixed(2)} | RSI {m.rsi} | AI Score {m.aiScore}
          </li>
        ))}
      </ul>
    </div>
  );
}
