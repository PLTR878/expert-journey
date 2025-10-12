// /pages/api/quote.js
export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    // ✅ ใช้ Yahoo API ตัวใหม่ที่ให้ราคาจริง
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    const q = data?.quoteResponse?.result?.[0];
    if (!q) return res.status(404).json({ error: "Symbol not found" });

    // ✅ ราคาปัจจุบันจริง
    const price =
      q.regularMarketPrice ??
      q.postMarketPrice ??
      q.preMarketPrice ??
      q.previousClose ??
      null;

    const changePct =
      q.regularMarketChangePercent ??
      q.postMarketChangePercent ??
      q.preMarketChangePercent ??
      0;

    // ✅ สร้าง RSI / Signal จำลอง
    const rsi = Math.floor(Math.random() * 40) + 30;
    const signal = rsi > 65 ? "Sell" : rsi < 40 ? "Buy" : "Hold";
    const conf = Math.random();

    res.status(200).json({
      symbol,
      price,
      changePct,
      rsi,
      signal,
      conf,
      marketState: q.marketState,
      time: q.regularMarketTime
    });
  } catch (error) {
    console.error("❌ Quote error:", error);
    res.status(500).json({ error: "Failed to fetch quote data" });
  }
}
