// ✅ /pages/api/screener-hybrid.js (เวอร์ชันรองรับ mode: short, swing, long, hidden)
export default async function handler(req, res) {
  try {
    const base = `https://${req.headers.host}`;
    const { mode } = req.query;

    // ดึงข้อมูลทั้งหมดจาก ai-picks ก่อน
    const resp = await fetch(`${base}/api/ai-picks?limit=150`);
    const data = await resp.json();
    const results = data.results || [];

    // ==== คัดกรองตาม mode ====
    let filtered = [];

    switch (mode) {
      // ⚡ Fast Movers (short)
      case "short":
        filtered = results
          .filter((x) => x.rsi > 60 && x.signal === "Buy")
          .sort((a, b) => b.rsi - a.rsi)
          .slice(0, 15);
        break;

      // 🌱 Emerging Trends (swing)
      case "swing":
        filtered = results
          .filter((x) => x.ema20 > x.ema50 && x.rsi > 55)
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);
        break;

      // 🚀 Future Leaders (long)
      case "long":
        filtered = results
          .filter((x) => x.score > 70 && x.signal === "Buy")
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);
        break;

      // 💎 Hidden Gems (hidden)
      case "hidden":
        filtered = results
          .filter((x) => x.price < 10 && x.ema20 > x.ema50 && x.rsi > 45)
          .sort((a, b) => b.rsi - a.rsi)
          .slice(0, 15);
        break;

      // ถ้าไม่ระบุ mode -> รวมทั้งหมด
      default:
        filtered = results.slice(0, 20);
        break;
    }

    // ส่งกลับในฟอร์แมตที่ Market.js ต้องการ
    res.status(200).json({
      mode,
      updated: new Date().toISOString(),
      results: filtered,
    });
  } catch (err) {
    console.error("❌ screener-hybrid error:", err);
    res.status(500).json({ error: err.message });
  }
}
