export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "No symbol provided" });

  // 🔧 Proxy API ฟรี (ถ้า Yahoo ตรงๆ ล้มเหลว)
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;

  try {
    // ดึงจาก proxy เพื่อเลี่ยง CORS Block
    const response = await fetch(proxyUrl);
    const dataWrapped = await response.json();

    // แกะ JSON จริงจาก allorigins
    const data = JSON.parse(dataWrapped.contents);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: "Quote not found" });

    res.status(200).json({
      symbol: symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketChangePercent,
      currency: meta.currency || "USD"
    });
  } catch (error) {
    console.error("Yahoo Proxy error:", error);
    res.status(500).json({ error: "Cannot fetch Yahoo data" });
  }
}
