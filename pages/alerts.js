// ✅ /pages/alerts.js — AI Market Scanner (works with visionary-scanner.js)
import { useState, useMemo } from "react";

export default function AlertsPage() {
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("batch"); // 'batch' | 'quick'
  const [progress, setProgress] = useState(0);
  const [batchNow, setBatchNow] = useState(0);
  const [batchTotal, setBatchTotal] = useState(null);
  const [matches, setMatches] = useState([]);
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");

  const addLog = (msg) =>
    setLog((p) => [...p.slice(-300), `${new Date().toLocaleTimeString()} ${msg}`]);

  const playSound = async () => {
    try {
      const audio = new Audio("/ding.mp3");
      await audio.play();
    } catch (_) {}
  };

  const upsertMatches = (arr) => {
    setMatches((prev) => {
      const map = new Map(prev.map((x) => [x.symbol, x]));
      for (const m of arr || []) {
        if (!m || !m.symbol) continue;
        map.set(m.symbol, { ...map.get(m.symbol), ...m });
      }
      return Array.from(map.values());
    });
  };

  const computeProgressFromMessage = (message) => {
    const m = /Batch\s+(\d+)\s*\/\s*(\d+)/i.exec(message || "");
    if (m) {
      const cur = Number(m[1]);
      const tot = Number(m[2]);
      setBatchNow(cur);
      setBatchTotal(tot);
      setProgress(Math.min(100, Math.round((cur / tot) * 100)));
    } else if (/ครบทุกตัว/i.test(message || "")) {
      setProgress(100);
    }
  };

  // 🔹 Batchscan Mode (ใช้ visionary-scanner.js)
  const scanBatch = async (batch = 1) => {
    const res = await fetch(`/api/visionary-scanner?type=ai-batchscan&batch=${batch}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    if (data.message) {
      addLog(`🚀 ${data.message} | วิเคราะห์ ${data.analyzed} พบ ${data.found}`);
      computeProgressFromMessage(data.message);
    }

    if (Array.isArray(data.top)) {
      upsertMatches(data.top);
      if (data.top.length) await playSound();
    }

    if (data.nextBatch) {
      await scanBatch(data.nextBatch);
    } else {
      addLog("✅ สแกนครบทุกตัวแล้ว!");
      setProgress(100);
      setRunning(false);
      await playSound();
    }
  };

  // 🔹 Quick Scan Mode (ใช้ visionary-scanner.js)
  const quickScan = async () => {
    const res = await fetch(`/api/visionary-scanner?type=scanner`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    addLog(`📡 Quick Scan: พบ ${data.stocks?.length || 0} ตัวที่โดดเด่น`);
    if (Array.isArray(data.stocks)) {
      upsertMatches(data.stocks);
      if (data.stocks.length) await playSound();
    }
    setProgress(100);
    setRunning(false);
  };

  // 🔹 Run Actions
  const run = async () => {
    setRunning(true);
    setError("");
    setProgress(0);
    setMatches([]);
    setLog([]);
    addLog(mode === "batch" ? "🧠 เริ่มสแกนตลาดแบบ Batch..." : "📡 เริ่ม Quick Scan...");

    try {
      if (mode === "batch") {
        await scanBatch(1);
      } else {
        await quickScan();
      }
    } catch (err) {
      setRunning(false);
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
    }
  };

  const stop = () => {
    setRunning(false);
    addLog("⏹️ ผู้ใช้กดหยุดการสแกน");
  };

  const headerNote = useMemo(() => {
    if (mode === "batch") {
      if (batchTotal)
        return `Progress: ${progress}% (Batch ${batchNow}/${batchTotal})`;
      return `Progress: ${progress}%`;
    }
    return `Quick Scan`;
  }, [mode, progress, batchNow, batchTotal]);

  return (
    <div className="p-4 text-white bg-[#0b0f17] min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-emerald-400">
          🛰️ AI Market Scanner
        </h2>
        <div className="flex items-center gap-1 text-[12px]">
          <button
            className={`px-2 py-[6px] rounded-md border ${
              mode === "batch"
                ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                : "text-gray-300 border-white/15 hover:bg-white/5"
            }`}
            onClick={() => setMode("batch")}
            disabled={running}
          >
            Batchscan
          </button>
          <button
            className={`px-2 py-[6px] rounded-md border ${
              mode === "quick"
                ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                : "text-gray-300 border-white/15 hover:bg-white/5"
            }`}
            onClick={() => setMode("quick")}
            disabled={running}
          >
            Quick Scan
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={run}
          disabled={running}
          className={`${
            running ? "bg-gray-600" : "bg-emerald-600 hover:bg-emerald-700"
          } text-white rounded-lg px-4 py-2`}
        >
          {running ? "⏳ Scanning..." : "▶ Run Now"}
        </button>
        <button
          onClick={stop}
          disabled={!running}
          className={`${
            running ? "bg-red-600 hover:bg-red-700" : "bg-gray-700"
          } text-white rounded-lg px-3 py-2`}
        >
          ⏹ Stop
        </button>
        <span className="text-sm text-gray-300">{headerNote}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-2 bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-[12px] text-red-400">❌ {error}</div>
      )}

      {/* Logs */}
      <div className="mt-3">
        <h3 className="text-emerald-400 mb-1 font-semibold text-sm">Logs</h3>
        <ul className="text-xs text-gray-300 space-y-1 max-h-64 overflow-auto bg-black/30 rounded-lg p-2 border border-white/10">
          {log.length ? log.map((l, i) => <li key={i}>{l}</li>) : <li>—</li>}
        </ul>
      </div>

      {/* Matches */}
      <div className="mt-4">
        <h3 className="text-emerald-400 mb-1 font-semibold">
          ✅ หุ้นที่ AI พบ ({matches.length})
        </h3>
        <ul className="text-sm space-y-1 bg-black/30 rounded-lg p-2 border border-white/10">
          {matches.length ? (
            matches.map((m) => (
              <li key={m.symbol} className="flex justify-between">
                <span className="font-mono">
                  {m.symbol}
                  <span className="text-gray-400">
                    {m.trend ? ` · ${m.trend}` : ""}
                    {typeof m.rsi === "number" ? ` · RSI ${m.rsi}` : ""}
                  </span>
                </span>
                <span className="font-mono">
                  {typeof m.price === "number" ? `$${m.price.toFixed(2)}` : ""}
                  {typeof m.aiScore === "number" ? ` · AI ${m.aiScore}` : ""}
                </span>
              </li>
            ))
          ) : (
            <li className="text-gray-400 text-sm">ยังไม่มีผลลัพธ์</li>
          )}
        </ul>
      </div>
    </div>
  );
              }
