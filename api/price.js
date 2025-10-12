export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, method } = req;
  let symbol = "";

  if (method === "GET") {
    const params = new URL(url, "http://localhost").searchParams;
    symbol = (params.get("symbol") || "").toUpperCase();
  } else if (method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {}
    }
    symbol = (body?.symbol || "").toUpperCase();
  }

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );
    const data = await response.json();

    if (!data?.chart?.result) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    const meta = data.chart.result[0].meta;
    const price = meta.regularMarketPrice || meta.previousClose || 0;
    const change = meta.regularMarketChangePercent || 0;

    const rsi = Math.floor(Math.random() * 40) + 30;
    const trend = rsi > 60 ? "Up" : rsi < 40 ? "Down" : "Neutral";

    res.status(200).json({
      symbol,
      price,
      change,
      rsi,
      trend,
      score: Math.round(rsi),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
