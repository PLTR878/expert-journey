// ✅ Visionary Batch Scanner — Full U.S. Market Optimized
export default async function handler(req, res) {
  const { batch = "1" } = req.query;
  const BATCH_SIZE = 300;
  const listURLs = [
    "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
    "https://datahub.io/core/nyse-listings/r/nyse-listed.csv",
  ];

  // ===== Indicators =====
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
      const d = arr[i] - arr[i - 1];
      if (d >= 0) g += d; else l -= d;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };
  const getYahoo = async (sym) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`;
    const r = await fetch(url);
    const j = await r.json();
    return j?.chart?.result?.[0];
  };

  try {
    let all = [];
    for (const url of listURLs) {
      const raw = await fetch(url).then(r => r.text());
      const tickers = raw.split("\n").map(l => l.split(",")[0]).filter(s => /^[A-Z.]+$/.test(s));
      all.push(...tickers);
    }

    const totalBatches = Math.ceil(all.length / BATCH_SIZE);
    const i = Math.min(Number(batch), totalBatches);
    const start = (i - 1) * BATCH_SIZE;
    const symbols = all.slice(start, start + BATCH_SIZE);

    const results = [];
    for (const s of symbols) {
      try {
        const d = await getYahoo(s);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter(x => typeof x === "number");
        if (!closes?.length) continue;
        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const last = closes.at(-1);
        const rsi = RSI(closes);
        const trend = last > ema20 && ema20 > ema50 ? "Up" : last < ema20 && ema20 < ema50 ? "Down" : "Side";
        const signal = trend === "Up" && rsi < 70 ? "Buy"
                      : trend === "Down" && rsi > 30 ? "Sell" : "Hold";

        results.push({ symbol: s, last: last.toFixed(2), ema20: ema20.toFixed(2), ema50: ema50.toFixed(2), rsi: rsi.toFixed(1), trend, signal });
      } catch {}
      await new Promise((r) => setTimeout(r, 150)); // ✅ ป้องกัน Yahoo block
    }

    const done = i >= totalBatches;
    res.status(200).json({
      success: true,
      message: done ? "✅ Completed all batches!" : `✅ Finished Batch ${i}/${totalBatches}`,
      nextBatch: done ? null : i + 1,
      totalSymbols: all.length,
      scanned: symbols.length,
      results,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
