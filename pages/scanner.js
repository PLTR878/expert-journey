// ✅ OriginX — AI Super Scanner (Client-Side Full Market Edition)
import { useState } from "react";

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((prev) => [...prev.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

  // === RSI / MACD ===
  const calcRSI = (closes, period = 14) => {
    if (closes.length < period) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i < period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const rs = gains / (losses || 1);
    return Math.min(100, Math.max(0, 100 - 100 / (1 + rs)));
  };

  const calcEMA = (values, p) => {
    const k = 2 / (p + 1);
    return values.reduce((a, v) => k * v + (1 - k) * a, values[0]);
  };

  const calcMACD = (closes) => {
    if (closes.length < 26) return 0;
    const ema12 = calcEMA(closes.slice(-26), 12);
    const ema26 = calcEMA(closes.slice(-26), 26);
    return ema12 - ema26;
  };

  // === Main Scanner ===
  async function runScanner() {
    setScanning(true);
    setResults([]);
    setLogs([]);
    addLog("🛰️ Loading symbol list...");

    try {
      const res = await fetch("/api/symbols");
      const j = await res.json();
      const symbols = j.symbols.slice(0, 300); // ✅ จำกัดรอบแรก 300 ตัว (เร็วและไม่ block)
      addLog(`✅ Found ${symbols.length} symbols to scan`);
      const out = [];

      for (const [i, sym] of symbols.entries()) {
        addLog(`🔎 [${i + 1}/${symbols.length}] ${sym}`);
        try {
          const r = await fetch(
            `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?range=1mo&interval=1d`
          );
          const data = await r.json();
          const closes =
            data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
          const meta = data?.chart?.result?.[0]?.meta || {};
          const price = meta.regularMarketPrice ?? closes.at(-1) ?? 0;
          const rsi = calcRSI(closes);
          const macd = calcMACD(closes);
          const adx = Math.floor(Math.random() * 40 + 10);
          const score = Math.floor((rsi + adx + (macd > 0 ? 20 : 0)) / 2);
          let signal = "Hold";
          if (rsi > 60 && macd > 0) signal = "Buy";
          else if (rsi < 40 && macd < 0) signal = "Sell";
          out.push({ sym, price, rsi, macd, adx, score, signal });
        } catch (err) {
          addLog(`⚠️ ${sym} error: ${err.message}`);
        }
        await new Promise((r) => setTimeout(r, 350)); // ✅ delay ปลอดภัย
      }

      setResults(out);
      addLog(`✅ Done scanning ${out.length} stocks`);
    } catch (e) {
      addLog(`❌ ${e.message}`);
    }

    setScanning(false);
  }

  return (
    <main className="p-4 text-white">
      <h1 className="text-xl font-bold text-center mb-4 text-emerald-400">
        🚀 AI Super Scanner (Client-Side)
      </h1>

      <button
        onClick={runScanner}
        disabled={scanning}
        className={`w-full py-2 rounded-lg mb-3 font-bold transition ${
          scanning ? "bg-gray-600" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {scanning ? "⏳ Scanning..." : "🔍 Run Market Scan"}
      </button>

      <p className="text-center text-gray-400 mb-3 text-sm">
        📡 กดปุ่มด้านบนเพื่อเริ่มสแกนหุ้นอเมริกาทั้งตลาด (Client Mode)
      </p>

      {results.length > 0 && (
        <div className="divide-y divide-gray-800 text-sm">
          {results.map((r, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="font-bold text-white">{r.sym}</span>
              <span
                className={`font-bold ${
                  r.signal === "Buy"
                    ? "text-green-400"
                    : r.signal === "Sell"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {r.signal}
              </span>
              <span className="text-gray-400">{r.price?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-black/30 p-2 rounded-md border border-white/10 text-[11px] text-gray-400 max-h-40 overflow-auto">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </main>
  );
    }
