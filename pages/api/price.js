// /pages/api/price.js
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const symbol = (req.query.symbol || "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

  let price = null;
  let changePercent = null;

  try {
    // ✅ 1) chart API
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        headers: { "User-Agent": ua, Accept: "application/json" },
      });
      const j = await r.json();
      const m = j?.chart?.result?.[0]?.meta;
      if (m) {
        price = m.regularMarketPrice ?? m.previousClose ?? null;
        changePercent = m.regularMarketChangePercent ?? null;
      }
    } catch {}

    // ✅ 2) quoteSummary Fallback
    if (price == null) {
      try {
        const r = await fetch(
          `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`,
          { headers: { "User-Agent": ua, Accept: "application/json" } }
        );
        const j = await r.json();
        const p = j?.quoteSummary?.result?.[0]?.price;
        if (p) {
          price = p?.regularMarketPrice?.raw ?? p?.previousClose?.raw ?? null;
          changePercent = p?.regularMarketChangePercent?.raw ?? null;
        }
      } catch {}
    }

    // ✅ 3) quote?symbols Fallback
    if (price == null) {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
          { headers: { "User-Agent": ua, Accept: "application/json" } }
        );
        const j = await r.json();
        const q = j?.quoteResponse?.result?.[0];
        if (q) {
          price = q?.regularMarketPrice ?? q?.previousClose ?? null;
          changePercent = q?.regularMarketChangePercent ?? null;
        }
      } catch {}
    }

    // ❌ ถ้าไม่มีราคาจริงเลย
    if (price == null) {
      return res.status(404).json({ error: "price not found" });
    }

    // ✅ สร้าง RSI และ AI Signal จำลอง
    const rsi = Math.floor(Math.random() * 40) + 30; // random RSI 30–70
    let signal = "Hold";
    if (rsi > 60) signal = "Buy";
    else if (rsi < 40) signal = "Sell";

    // ✅ ส่งข้อมูลกลับ frontend
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({
      symbol,
      price,
      changePercent,
      rsi,
      signal,
    });
  } catch (e) {
    console.error("price api error:", e);
    return res.status(500).json({ error: "internal error" });
  }
}
