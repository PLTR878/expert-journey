export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  const lastClose = Number((Math.random() * 100).toFixed(2));
  const rsi = Math.floor(Math.random() * 50) + 25;
  const trend = rsi > 60 ? "Uptrend" : rsi < 40 ? "Downtrend" : "Sideway";

  res.status(200).json({
    symbol,
    lastClose,
    rsi,
    trend,
    ema20: (lastClose * 0.98).toFixed(2),
    ema50: (lastClose * 0.95).toFixed(2),
    ema200: (lastClose * 0.9).toFixed(2),
  });
}
