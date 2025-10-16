// ✅ /pages/index.js — Visionary Stock Screener (AutoMarketScan Pro UI)
import { useState, useEffect } from "react";

export default function Home() {
  const [enabled, setEnabled] = useState(false);
  const [aiSignal, setAiSignal] = useState("Buy");
  const [rsiMin, setRsiMin] = useState("30");
  const [rsiMax, setRsiMax] = useState("70");
  const [priceMin, setPriceMin] = useState("1");
  const [priceMax, setPriceMax] = useState("1000");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [hits, setHits] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [messages, setMessages] = useState([]);

  // 🔊 แจ้งเตือนเสียงเมื่อเจอหุ้นเข้าเงื่อนไข
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    } catch {}
  };

  // 🚀 ฟังก์ชันเริ่มสแกน
  const runScan = async () => {
    if (scanning) return;
    setScanning(true);
    setLogs(["🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..."]);
    setHits([]);
    setProgress(0);

    try {
      const url = `/api/scan?mode=${aiSignal}&rsiMin=${rsiMin}&rsiMax=${rsiMax}&priceMin=${priceMin}&priceMax=${priceMax}&maxSymbols=8000&batchSize=80`;
      const res = await fetch(url);
      if (!res.body) throw new Error("ไม่สามารถอ่านสตรีมข้อมูลได้");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const data = JSON.parse(part);
            if (data.log)
              setLogs((p) => [...p, data.log].slice(-100)); // เก็บ log ล่าสุด
            if (data.progress) setProgress(data.progress);
            if (data.hit) {
              setHits((p) => [...p, data.hit]);
              beep();
              setMessages((p) => [
                ...p,
                {
                  id: Date.now(),
                  msg: `⚡ ${data.hit.symbol} | ${data.hit.ai} | RSI ${data.hit.rsi}`,
                },
              ]);
            }
            if (data.done) {
              setLogs((p) => [...p, "✅ สแกนครบแล้ว!"]);
              setProgress(100);
            }
          } catch {}
        }
      }
    } catch (err) {
      setLogs((p) => [...p, `❌ Error: ${err.message}`]);
    } finally {
      setScanning(false);
    }
  };

  // 🔁 Auto-scan ทุก 5 นาที
  useEffect(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  // 🔔 ลบข้อความแจ้งเตือนอัตโนมัติ
  useEffect(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => setMessages((p) => p.filter((x) => x.id !== m.id)), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <main className="min-h-screen bg-[#0b1221] text-gray-200 p-4 font-sans">
      <h1 className="text-2xl font-bold text-cyan-300 mb-4 text-center">
        🌎 Visionary Stock Screener
      </h1>

      {/* 🔧 ตัวควบคุม */}
      <div className="bg-[#101827]/80 rounded-xl p-4 border border-cyan-400/20 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-emerald-300 font-semibold">Auto Enable</span>
          </label>

          <select
            className="bg-[#141b2d] px-2 py-1 rounded"
            value={aiSignal}
            onChange={(e) => setAiSignal(e.target.value)}
          >
            <option>Buy</option>
            <option>Sell</option>
            <option>Neutral</option>
            <option>Any</option>
          </select>

          <input
            className="bg-[#141b2d] px-2 py-1 rounded"
            placeholder="RSI Min"
            value={rsiMin}
            onChange={(e) => setRsiMin(e.target.value)}
          />
          <input
            className="bg-[#141b2d] px-2 py-1 rounded"
            placeholder="RSI Max"
            value={rsiMax}
            onChange={(e) => setRsiMax(e.target.value)}
          />
          <input
            className="bg-[#141b2d] px-2 py-1 rounded"
            placeholder="Price Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <input
            className="bg-[#141b2d] px-2 py-1 rounded"
            placeholder="Price Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />

          <button
            onClick={runScan}
            disabled={scanning}
            className={`rounded px-3 py-2 font-semibold border ${
              scanning
                ? "bg-gray-600/30 border-gray-500 text-gray-400"
                : "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
            }`}
          >
            {scanning ? "🔍 Scanning..." : "▶️ Run Now"}
          </button>
        </div>

        {/* Progress */}
        <div className="w-full bg-[#1a2335] h-2 rounded mt-2">
          <div
            className="bg-cyan-400 h-2 rounded transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-cyan-300 mt-1">
          {scanning
            ? `กำลังสแกน... ${progress}%`
            : `สถานะ: ${enabled ? "Auto Enabled" : "Idle"}`}
        </div>
      </div>

      {/* 📜 Log */}
      <div className="bg-[#0d1423]/70 p-3 rounded-lg text-xs text-gray-300 h-40 overflow-y-auto font-mono">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* ⚡ หุ้นที่เข้าเงื่อนไข */}
      <div className="mt-4">
        <h2 className="text-cyan-200 text-sm font-semibold mb-2">
          Latest Matches ({hits.length})
        </h2>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบหุ้นเข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2"
              >
                ⚡ {h.symbol} — {h.ai} | RSI={h.rsi} | ${h.price}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔔 Toast */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-cyan-400/40 text-cyan-100 px-3 py-2 rounded shadow"
          >
            {m.msg}
          </div>
        ))}
      </div>
    </main>
  );
          }
