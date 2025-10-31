// ✅ /pages/api/visionary-core.js — AI Core (Stable Restore)
export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("No data");

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const prices = quotes.close?.filter(Boolean) || [];
    const lastClose = prices.at(-1) || 0;

    // RSI
    const calcRSI = (arr, period = 14) => {
      if (arr.length < period + 1) return 50;
      let gains = 0, losses = 0;
      for (let i = arr.length - period; i < arr.length; i++) {
        const diff = arr[i] - arr[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - 100 / (1 + rs);
    };
    const rsi = Number(calcRSI(prices, 14).toFixed(2));

    // EMA
    const calcEMA = (arr, period) => {
      if (arr.length < period) return lastClose;
      const k = 2 / (period + 1);
      let ema = arr[0];
      for (let i = 1; i < arr.length; i++) ema = arr[i] * k + ema * (1 - k);
      return ema.toFixed(2);
    };
    const ema20 = Number(calcEMA(prices, 20));
    const ema50 = Number(calcEMA(prices, 50));
    const ema200 = Number(calcEMA(prices, 200));

    const trend =
      lastClose > ema20 && ema20 > ema50
        ? "Uptrend"
        : lastClose < ema20 && ema20 < ema50
        ? "Downtrend"
        : "Sideway";

    const prevClose = prices.at(-2) || lastClose;
    const change = ((lastClose - prevClose) / prevClose) * 100;

    let signal = "Hold";
    let aiScore = 50;
    aiScore += trend === "Uptrend" ? 15 : trend === "Downtrend" ? -15 : 0;
    aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
    aiScore += rsi < 40 ? 10 : rsi > 70 ? -10 : 0;
    aiScore = Math.max(0, Math.min(100, aiScore));

    if (aiScore >= 70 && trend === "Uptrend" && rsi < 70) signal = "Buy";
    else if (aiScore <= 30 && trend === "Downtrend" && rsi > 55) signal = "Sell";

    let confidence = 0;
    if (signal === "Buy") {
      confidence =
        (rsi > 40 && rsi < 65 ? 25 : 0) +
        (ema20 > ema50 ? 25 : 0) +
        (change > 0 ? 25 : 0) +
        (trend === "Uptrend" ? 25 : 0);
    } else if (signal === "Sell") {
      confidence =
        (rsi > 60 ? 25 : 0) +
        (ema20 < ema50 ? 25 : 0) +
        (change < 0 ? 25 : 0) +
        (trend === "Downtrend" ? 25 : 0);
    }
    confidence = Math.min(100, confidence);

    res.status(200).json({
      symbol,
      lastClose: Number(lastClose.toFixed(2)),
      rsi,
      ema20,
      ema50,
      ema200,
      trend,
      change: Number(change.toFixed(2)),
      signal,
      aiScore,
      confidence,
      chart: { timestamps, prices, open: quotes.open, high: quotes.high, low: quotes.low, volume: quotes.volume },
      source: "Yahoo Finance + OriginX AI Core v∞.52 (Restored)"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
        }
