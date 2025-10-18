// ✅ /pages/api/screener-hybrid.js — กล่องรวม AI หุ้นแบ่งหมวดหมู่ครบ
export default async function handler(req, res) {
  try {
    const mode = req.query.mode || "short";
    const base = "https://expert-journey-ten.vercel.app"; // เปลี่ยนเป็นโดเมนของคุณ เช่น https://expert-journey-ten.vercel.app
    const r = await fetch(`${base}/api/ai-picks`);
    const j = await r.json();
    const data = j.results || [];

    // 🔍 แบ่งตามโหมด
    let filtered = [];
    if (mode === "short") {
      filtered = data
        .filter(x => x.signal === "Buy" && x.trend === "Uptrend")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } else if (mode === "swing") {
      filtered = data
        .filter(x => x.signal === "Hold" && x.trend === "Uptrend")
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);
    } else if (mode === "long") {
      filtered = data
        .filter(x => x.signal !== "Sell" && x.trend === "Uptrend")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } else if (mode === "hidden") {
      filtered = data
        .filter(x => x.signal === "Buy" && x.trend === "Downtrend")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    res.status(200).json({ mode, count: filtered.length, results: filtered });
  } catch (err) {
    console.error("Hybrid Error:", err.message);
    res.status(500).json({ error: err.message, results: [] });
  }
}
