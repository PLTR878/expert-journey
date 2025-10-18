// ✅ /pages/api/screener-hybrid.js — เชื่อมตรงกับ pages/index.js (V5.1)
export default async function handler(req, res) {
  try {
    const { mode } = req.query;
    const base = `https://${req.headers.host}`;

    // ดึงหุ้นทั้งหมดจาก AI Picks (AI ที่คัดไว้แล้ว)
    const resp = await fetch(`${base}/api/ai-picks?limit=200`);
    const data = await resp.json();
    const all = data.results || [];

    let filtered = [];

    // 🎯 คัดกรองตามโหมด (ตามที่ index.js เรียก)
    switch (mode) {
      case "short":
        filtered = all
          .filter((x) => x.signal === "Buy" && x.rsi > 60)
          .sort((a, b) => b.rsi - a.rsi)
          .slice(0, 20);
        break;

      case "swing":
        filtered = all
          .filter((x) => x.ema20 > x.ema50 && x.rsi > 55)
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);
        break;

      case "long":
        filtered = all
          .filter((x) => x.signal === "Buy" && x.score > 70)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 20);
        break;

      case "hidden":
        filtered = all
          .filter((x) => x.price < 10 && x.signal === "Buy")
          .sort((a, b) => b.rsi - a.rsi)
          .slice(0, 20);
        break;

      default:
        filtered = all.slice(0, 20);
        break;
    }

    // ✅ ส่งกลับให้ index.js ใช้ได้ทันที
    res.status(200).json({
      mode,
      count: filtered.length,
      results: filtered.map((x) => ({
        symbol: x.symbol,
        price: x.price,
        rsi: x.rsi,
        signal: x.signal,
        ema20: x.ema20,
        ema50: x.ema50,
        score: x.score,
      })),
    });
  } catch (err) {
    console.error("❌ screener-hybrid error:", err);
    res.status(500).json({ error: err.message });
  }
}
