// ✅ /pages/api/screener-hybrid.js
// แยกหุ้นเป็น 4 หมวดครบทุกกลุ่ม (Fast, Emerging, Future, Hidden)
export default async function handler(req, res) {
  try {
    const base = "https://expert-journey-ten.vercel.app"; // URL ของโปรเจคคุณ
    const data = await fetch(`${base}/api/ai-picks`).then(r => r.json());
    const list = data.results || [];

    // แยกหมวดชัดเจน
    const fast = list
      .filter(x => x.signal === "Buy" && x.trend === "Uptrend" && x.rsi < 60)
      .slice(0, 25);

    const emerging = list
      .filter(x => x.signal === "Hold" && x.trend === "Uptrend" && x.rsi >= 45 && x.rsi <= 65)
      .slice(0, 25);

    const future = list
      .filter(x => x.confidence > 70 && x.trend === "Uptrend" && x.signal !== "Sell")
      .slice(0, 25);

    const hidden = list
      .filter(x => x.price < 10 && x.signal === "Buy" && x.trend === "Uptrend")
      .slice(0, 25);

    res.status(200).json({
      updated: new Date().toISOString(),
      groups: {
        fast,
        emerging,
        future,
        hidden
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
