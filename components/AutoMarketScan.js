import { useState, useEffect } from "react";

export default function AutoMarketScan() {
  const [enabled, setEnabled] = useState(false);
  const [aiSignal, setAiSignal] = useState("Any");
  const [rsiMin, setRsiMin] = useState("25");
  const [rsiMax, setRsiMax] = useState("70");
  const [priceMin, setPriceMin] = useState("0.5");
  const [priceMax, setPriceMax] = useState("100");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [hits, setHits] = useState([]);

  // ===== เสียงเตือนและสั่นมือถือ =====
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 800;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 180);
    } catch {}
  };
  const vibrate = (ms = 250) => navigator.vibrate && navigator.vibrate(ms);

  // ===== สั่งสแกน =====
  const runScan = () => {
    if (!enabled) return;
    setLogs(["🚀 เริ่มสแกนตลาดหุ้นอเมริกา..."]);
    setHits([]);
    setProgress(0);

    const es = new EventSource(
      `/api/scan?mode=${aiSignal}&rsiMin=${rsiMin}&rsiMax=${rsiMax}&priceMin=${priceMin}&priceMax=${priceMax}`
    );

    es.onmessage = (e) => {
      if (!e.data) return;
      try {
        const data = JSON.parse(e.data);
        if (data.log) setLogs((prev) => [...prev.slice(-60), data.log]);
        if (data.progress) setProgress(data.progress);
        if (data.hit) {
          setHits((prev) => [...prev.slice(-30), data.hit]);
          beep();
          vibrate();
        }
        if (data.done) {
          setLogs((prev) => [...prev, "✅ สแกนเสร็จสมบูรณ์"]);
          setProgress(100);
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      setLogs((p) => [...p, "❌ การเชื่อมต่อขาดหาย, กำลังปิด..."]);
      es.close();
    };
  };

  // ===== Auto run ทุก 10 นาที =====
  useEffect(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">
        🛰️ Auto Scan — US Stocks
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="text-emerald-300 font-semibold">Enable</span>
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
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold"
        >
          ▶️ Run Now
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#1a2335] h-2 rounded">
        <div
          className="bg-cyan-400 h-2 rounded transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-xs text-cyan-300 mt-1">
        Scanning... {progress}%
      </div>

      {/* Logs */}
      <div className="bg-[#0d1423]/60 p-2 mt-3 rounded text-[12px] text-gray-300 h-28 overflow-y-auto font-mono">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* Hits */}
      <div className="mt-3">
        <h3 className="text-cyan-200 text-sm font-semibold mb-1">
          Latest Matches ({hits.length})
        </h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">
            ยังไม่พบหุ้นเข้าเงื่อนไข
          </div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-1.5"
              >
                ⚡ {h.symbol} | {h.ai} | RSI={h.rsi} | ${h.price}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
            }
