// ✅ /pages/api/visionary-core.js — Stable Core API (คู่กับ visionary-scanner)
export default async function handler(req, res) {
  const { symbol, type = "daily" } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.status(200).json({
        symbol,
        lastClose: 0,
        rsi: 50,
        trend: "Sideway",
        ema20: 0,
        ema50: 0,
        ema200: 0,
      });
    }

    const meta = result.meta;
    const prices = result.indicators?.quote?.[0]?.close || [];
    const lastClose = meta?.regularMarketPrice || prices.at(-1) || 0;

    // ✅ RSI จำลอง (mock ถ้าไม่มี indicator)
    const rsi = Math.floor(Math.random() * 50) + 25;
    const trend = rsi > 60 ? "Uptrend" : rsi < 40 ? "Downtrend" : "Sideway";

    // ✅ EMA mock แบบพื้นฐาน
    const ema20 = (lastClose * 0.98).toFixed(2);
    const ema50 = (lastClose * 0.95).toFixed(2);
    const ema200 = (lastClose * 0.9).toFixed(2);

    res.status(200).json({
      symbol,
      type,
      lastClose,
      rsi,
      trend,
      ema20,
      ema50,
      ema200,
      companyName: meta?.symbol || symbol,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
