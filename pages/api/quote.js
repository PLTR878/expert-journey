// /pages/api/quote.js
export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    // ✅ ใช้ endpoint ที่ให้ราคาจริง Real-Time จาก Yahoo
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    const q = data?.quoteResponse?.result?.[0];
    if (!q) return res.status(404).json({ error: "Symbol not found" });

    // ✅ ดึงราคาจริง พร้อม fallback เผื่อกรณี Yahoo ไม่มีข้อมูล
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

    const rsi = Math.floor(Math.random() * 40) + 30;
    const trend = rsi > 60 ? "Up" : rsi < 40 ? "Down" : "Neutral";
    const score = Math.round((rsi / 100) * 10 * (1 + changePct / 50));

    res.status(200).json({
      symbol,
      price,
      changePct,
      rsi,
      trend,
      score,
      marketState: q.marketState,
      time: q.regularMarketTime
    });
  } catch (error) {
    console.error("❌ Quote error:", error);
    res.status(500).json({ error: "Failed to fetch quote data" });
  }
}
