// ✅ OriginX AI Core v∞.60 — Stable, Plug & Play on Vercel
export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol)
    return res.status(400).json({ error: "Missing symbol" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    const r = await fetch(url);
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) throw new Error("No chart data");

    const prices = result.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
    const last = prices.at(-1) || 0;
    const prev = prices.at(-2) || last;

    // === RSI ===
    const calcRSI = (arr, period = 14) => {
      if (arr.length < period + 1) return 50;
      let gain = 0, loss = 0;
      for (let i = arr.length - period; i < arr.length; i++) {
        const diff = arr[i] - arr[i - 1];
        if (diff > 0) gain += diff; else loss -= diff;
      }
      const avgG = gain / period, avgL = loss / period;
      if (avgL === 0) return 100;
      const rs = avgG / avgL;
      return 100 - 100 / (1 + rs);
    };
    const rsi = Number(calcRSI(prices, 14).toFixed(2));

    // === EMA ===
    const calcEMA = (arr, p) => {
      if (arr.length < p) return last;
      const k = 2 / (p + 1);
      let ema = arr[0];
      for (let i = 1; i < arr.length; i++)
        ema = arr[i] * k + ema * (1 - k);
      return Number(ema.toFixed(2));
    };
    const ema20 = calcEMA(prices, 20);
    const ema50 = calcEMA(prices, 50);
    const ema200 = calcEMA(prices, 200);

    // === Trend Detection ===
    const trend =
      last > ema20 && ema20 > ema50
        ? "Uptrend"
        : last < ema20 && ema20 < ema50
        ? "Downtrend"
        : "Sideway";

    // === Momentum ===
    const change = ((last - prev) / prev) * 100;

    // === AI Logic ===
    let aiScore = 50, signal = "Hold";
    aiScore += trend === "Uptrend" ? 15 : trend === "Downtrend" ? -15 : 0;
    aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
    aiScore += rsi < 40 ? 10 : rsi > 70 ? -10 : 0;
    aiScore = Math.max(0, Math.min(100, aiScore));

    if (aiScore >= 70 && trend === "Uptrend" && rsi < 70) signal = "Buy";
    else if (aiScore <= 30 && trend === "Downtrend" && rsi > 55) signal = "Sell";

    const confidence =
      signal === "Buy"
        ? Math.min(
            100,
            (rsi > 40 && rsi < 65 ? 25 : 0) +
              (ema20 > ema50 ? 25 : 0) +
              (change > 0 ? 25 : 0) +
              (trend === "Uptrend" ? 25 : 0)
          )
        : signal === "Sell"
        ? Math.min(
            100,
            (rsi > 60 ? 25 : 0) +
              (ema20 < ema50 ? 25 : 0) +
              (change < 0 ? 25 : 0) +
              (trend === "Downtrend" ? 25 : 0)
          )
        : 50;

    // === Response ===
    res.status(200).json({
      symbol,
      price: Number(last.toFixed(2)),
      rsi,
      ema20,
      ema50,
      ema200,
      trend,
      change: Number(change.toFixed(2)),
      aiScore,
      confidence,
      signal,
      source: "OriginX AI v∞.60 — Yahoo Finance",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
