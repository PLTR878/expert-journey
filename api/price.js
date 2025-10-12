export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.chart?.result) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    const meta = data.chart.result[0].meta;
    const price = meta.regularMarketPrice || meta.previousClose || null;
    const change = meta.regularMarketChangePercent || 0;
    const rsi = Math.floor(Math.random() * 40) + 30;
    const trend = rsi > 60 ? "Up" : rsi < 40 ? "Down" : "Neutral";
    const score = Math.floor((rsi / 100) * 100);

    return res.status(200).json({
      symbol,
      price,
      change,
      rsi,
      trend,
      score
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
}
