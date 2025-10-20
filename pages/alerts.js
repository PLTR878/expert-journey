// ✅ /pages/alerts.js — AI Market Scanner UI (works with visionary-eternal.js)
// รองรับ 2 โหมด: Batchscan (ทั้งตลาดหลาย batch) และ Quick Scan (ชุดย่อยทันที)
import { useState, useMemo } from "react";

export default function AlertsPage() {
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("batch"); // 'batch' | 'scanner'
  const [progress, setProgress] = useState(0);
  const [batchNow, setBatchNow] = useState(0);
  const [batchTotal, setBatchTotal] = useState(null); // unknown until message has X/Y
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

  // ---------- Helpers ----------
  const upsertMatches = (arr) => {
    // รวมผลใหม่ + กันซ้ำตาม symbol
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
    // message ตัวอย่าง:
    // "✅ สแกน Batch 3/24 เสร็จแล้ว" หรือ "✅ สแกนครบทุกตัวแล้ว!"
    const m = /Batch\s+(\d+)\s*\/\s*(\d+)/i.exec(message || "");
    if (m) {
      const cur = Number(m[1]);
      const tot = Number(m[2]);
      setBatchNow(cur);
      setBatchTotal(tot);
      setProgress(Math.max(0, Math.min(100, Math.round((cur / tot) * 100))));
    } else if (/ครบทุกตัว/i.test(message || "")) {
      setProgress(100);
    }
  };

  // ---------- API calls ----------
  // โหมด Batchscan (เรียกซ้ำทีละ batch จนจบ)
  const scanBatch = async (batch = 1) => {
    const url = `/api/visionary-eternal?type=ai-batchscan&batch=${batch}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    // logs
    if (data.message) {
      addLog(`🚀 ${data.message} | วิเคราะห์ ${data.analyzed} ตัว พบ ${data.found}`);
      computeProgressFromMessage(data.message);
    } else {
      addLog(`🚀 Batch ${batch}: วิเคราะห์ ${data.analyzed} พบ ${data.found}`);
    }

    // รวมหุ้นที่เจอ (field: top)
    if (Array.isArray(data.top) && data.top.length) {
      upsertMatches(
        data.top.map((x) => ({
          symbol: x.symbol,
          price: x.price,
          rsi: x.rsi,
          aiScore: x.aiScore,
          sentiment: x.sentiment,
        }))
      );
      await playSound();
    }

    if (data.nextBatch) {
      setBatchNow((n) => (n ? Math.max(n, batch) : batch));
      await scanBatch(data.nextBatch);
    } else {
      setRunning(false);
      addLog("✅ สแกนครบทุกตัวแล้ว!");
      setProgress(100);
      await playSound();
    }
  };

  // โหมด Quick Scanner (ยิงครั้งเดียว)
  const quickScanner = async () => {
    const url = `/api/visionary-eternal?type=scanner`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    addLog(`📡 Quick Scan: พบ ${data.scanned} ตัว`);
    if (Array.isArray(data.stocks) && data.stocks.length) {
      upsertMatches(
        data.stocks.map((x) => ({
          symbol: x.symbol,
          price: x.lastClose,
          rsi: x.rsi,
          signal: x.signal,
          trend: x.trend,
        }))
      );
      await playSound();
    }
    setProgress(100);
    setRunning(false);
  };

  // ---------- Actions ----------
  const run = async () => {
    setRunning(true);
    setError("");
    setProgress(0);
    setBatchNow(0);
    setBatchTotal(null);
    setMatches([]);
    setLog([]);
    addLog(mode === "batch" ? "🧠 เริ่มสแกนตลาดแบบ Batch..." : "📡 เริ่ม Quick Scan...");

    try {
      if (mode === "batch") {
        await scanBatch(1);
      } else {
        await quickScanner();
      }
    } catch (err) {
      setRunning(false);
      setError(err.message || String(err));
      addLog(`❌ Error: ${err.message || err}`);
    }
  };

  const stop = () => {
    // ไม่มี cancel fetch ง่าย ๆ ในเบราว์เซอร์ (ต้องใช้ AbortController)
    // ให้ถือว่าหยุด UI ไว้ก่อน
    setRunning(false);
    addLog("⏹️ ผู้ใช้กดหยุดการสแกน");
  };

  const headerNote = useMemo(() => {
    if (mode === "batch") {
      if (batchTotal) return `Progress: ${progress}% (Batch ${batchNow}/${batchTotal})`;
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

        {/* Mode toggle */}
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
              mode === "scanner"
                ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                : "text-gray-300 border-white/15 hover:bg-white/5"
            }`}
            onClick={() => setMode("scanner")}
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

      {/* Error */}
      {error ? (
        <div className="mt-3 text-[12px] text-red-400">
          ❌ {error}
        </div>
      ) : null}

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
                  {m.signal ? ` · ${m.signal}` : ""}
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
