// ✅ Visionary Scanner API — V∞.21L (Batch + Quick Scan)
export default async function handler(req, res) {
  const { type = "ai-batchscan", batch = "1" } = req.query;

  const BATCH_SIZE = 200;
  const stockList = "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv";

  const EMA = (arr, p) => {
    if (!arr?.length) return null;
    const k = 2 / (p + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };
  const RSI = (arr, n = 14) => {
    if (!arr || arr.length < n + 1) return 50;
    let g = 0, l = 0;
    for (let i = 1; i <= n; i++) {
      const diff = arr[i] - arr[i - 1];
      if (diff >= 0) g += diff; else l -= diff;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  try {
    // 🔹 QUICK SCANNER (Top Symbols)
    if (type === "scanner") {
      const symbols = ["AAPL", "TSLA", "NVDA", "PLTR", "AMD", "MSFT", "GWH", "NRGV", "SLDP"];
      const results = [];
      for (const sym of symbols) {
        try {
          const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`);
          const j = await r.json();
          const q = j?.chart?.result?.[0]?.indicators?.quote?.[0];
          const c = q?.close?.filter(x => typeof x === "number");
          if (!c?.length) continue;
          const ema20 = EMA(c, 20);
          const ema50 = EMA(c, 50);
          const last = c.at(-1);
          const rsi = RSI(c);
          const trend = last > ema20 && ema20 > ema50 && rsi > 55 ? "Uptrend" :
                        last < ema20 && ema20 < ema50 && rsi < 45 ? "Downtrend" : "Sideway";
          results.push({ symbol: sym, lastClose: last, rsi, trend });
        } catch {}
      }
      return res.status(200).json({ scanned: results.length, stocks: results });
    }

    // 🔹 AI BATCHSCAN (Large Scale)
    if (type === "ai-batchscan") {
      const csv = await fetch(stockList).then(r => r.text());
      const all = csv.split("\n").map(l => l.split(",")[0]).filter(s => /^[A-Z.]+$/.test(s)).slice(0, 2000);
      const total = Math.ceil(all.length / BATCH_SIZE);
      const idx = Math.min(Number(batch), total);
      const start = (idx - 1) * BATCH_SIZE;
      const symbols = all.slice(start, start + BATCH_SIZE);

      const results = [];
      for (const sym of symbols) {
        try {
          const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`);
          const j = await r.json();
          const q = j?.chart?.result?.[0]?.indicators?.quote?.[0];
          const c = q?.close?.filter(x => typeof x === "number");
          if (!c?.length) continue;
          const ema20 = EMA(c, 20);
          const ema50 = EMA(c, 50);
          const last = c.at(-1);
          const rsi = RSI(c);
          if (last > 35 || rsi < 55 || ema20 <= ema50) continue;
          const aiScore = (rsi - 50) * 2;
          results.push({ symbol: sym, price: Number(last.toFixed(2)), rsi: Math.round(rsi), aiScore });
        } catch {}
      }

      const done = idx === total;
      return res.status(200).json({
        message: done ? "✅ สแกนครบทุกตัวแล้ว!" : `✅ Batch ${idx}/${total}`,
        analyzed: symbols.length,
        found: results.length,
        nextBatch: done ? null : idx + 1,
        top: results.slice(0, 10),
      });
    }

    res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
  }
