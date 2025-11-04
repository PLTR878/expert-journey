// ✅ /pages/api/quote.js — ดึงราคาหุ้นจาก Yahoo Finance
export default async function handler(req, res) {
  const { symbol = "PLTR" } = req.query;
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
    );
    const j = await r.json();
    const q = j?.quoteResponse?.result?.[0];
    if (!q) return res.status(404).json({ error: "Symbol not found" });

    res.status(200).json({
      symbol,
      name: q.shortName || symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChangePercent,
      high: q.regularMarketDayHigh,
      low: q.regularMarketDayLow,
      volume: q.regularMarketVolume,
      marketCap: q.marketCap,
      time: q.regularMarketTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
