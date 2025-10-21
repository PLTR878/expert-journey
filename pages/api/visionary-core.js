// ✅ /pages/api/visionary-core.js (Enhanced Chart + Technical Data)
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
    const ema20 = calcEMA(prices, 20);
    const ema50 = calcEMA(prices, 50);
    const ema200 = calcEMA(prices, 200);

    const trend =
      lastClose > ema20 && ema20 > ema50
        ? "Uptrend"
        : lastClose < ema20 && ema20 < ema50
        ? "Downtrend"
        : "Sideway";

    res.status(200).json({
      symbol,
      lastClose: Number(lastClose.toFixed(2)),
      rsi,
      ema20,
      ema50,
      ema200,
      trend,
      chart: {
        timestamps,
        prices,
        open: quotes.open,
        high: quotes.high,
        low: quotes.low,
        volume: quotes.volume,
      },
      source: "Yahoo Finance",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
        }
