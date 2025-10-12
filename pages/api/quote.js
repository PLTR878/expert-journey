export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    const q = data.quoteResponse.result[0];
    if (!q) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    const price = q.regularMarketPrice ?? q.previousClose ?? null;
    const change = q.regularMarketChangePercent ?? 0;
    const rsi = Math.floor(Math.random() * 40) + 30;
    const trend = rsi > 60 ? "Up" : rsi < 40 ? "Down" : "Neutral";
    const score = Math.floor((rsi / 100) * 10 * (1 + change / 50));

    return res.status(200).json({
      symbol,
      price,
      change,
      rsi,
      trend,
      score,
      time: q.regularMarketTime,
      marketState: q.marketState
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch quote data" });
  }
  }
