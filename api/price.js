// api/price.js
export default async function handler(req, res) {
  // --- CORS (อนุญาตจากทุก origin พื้นฐาน) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // --- รองรับ query ทั้ง GET/POST และ fallback จาก URL ---
    let symbol = "";
    if (req.method === "GET") {
      // บาง environment ไม่มี req.query → parse จาก URL
      const urlObj = new URL(req.url, "http://localhost");
      symbol = (urlObj.searchParams.get("symbol") || "").trim().toUpperCase();
    } else if (req.method === "POST") {
      let body = req.body;
      // ถ้ามาเป็น raw string
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch {}
      }
      symbol = ((body && body.symbol) || "").trim().toUpperCase();
    }

    if (!symbol) {
      return res.status(400).json({ error: "Missing symbol" });
    }

    // --- ดึงจาก Yahoo ---
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }

    const data = await response.json();

    // โครงสร้างผิดปกติ
    const chart = data?.chart;
    if (!chart) {
      return res.status(502).json({ error: "Malformed response from Yahoo" });
    }

    // Yahoo มักให้ result = null และใส่ error แทน
    if (!chart.result || !Array.isArray(chart.result) || chart.result.length === 0) {
      const yError = chart.error?.description || chart.error?.code || "Symbol not found";
      return res.status(404).json({ error: yError, symbol });
    }

    const meta = chart.result[0]?.meta || {};
    const price =
      typeof meta.regularMarketPrice === "number"
        ? meta.regularMarketPrice
        : typeof meta.previousClose === "number"
        ? meta.previousClose
        : null;

    const change =
      typeof meta.regularMarketChangePercent === "number"
        ? meta.regularMarketChangePercent
        : null;

    // --- mock RSI/สัญญาณ (ถ้ายังไม่มีแหล่งคำนวณจริง) ---
    const rsi = Math.floor(Math.random() * 40) + 30; // 30–70
    const trend = rsi > 60 ? "Up" : rsi < 40 ? "Down" : "Neutral";
    const score = Math.round(rsi); // ให้สัมพันธ์ง่าย ๆ

    return res.status(200).json({
      symbol,
      price,
      change,
      rsi,
      trend,
      score
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch data",
      details: String(error?.message || error)
    });
  }
}
