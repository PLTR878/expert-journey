export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "No symbol provided" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0]?.meta;
    if (!result) return res.status(404).json({ error: "Quote not found" });

    res.status(200).json({
      symbol,
      price: result.regularMarketPrice,
      change: result.regularMarketChangePercent,
      currency: result.currency || "USD"
    });
  } catch (e) {
    res.status(500).json({ error: "Cannot fetch Yahoo data" });
  }
}
