// ✅ /pages/api/screener-hybrid.js
// AI Screener แบบอัจฉริยะ คัดหุ้นดีสุดอัตโนมัติแต่ละกลุ่ม

export default async function handler(req, res) {
  try {
    const base = `https://${req.headers.host}`;
    const resp = await fetch(`${base}/api/ai-picks?limit=100`);
    const data = await resp.json();

    if (!data.results?.length) throw new Error("No AI data");

    const results = data.results;

    // กลุ่ม Emerging Trends: RSI > 55 และ EMA20 > EMA50
    const emerging = results
      .filter(x => x.rsi > 55 && x.ema20 > x.ema50 && x.signal === "Buy")
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // กลุ่ม Future Leaders: signal = "Buy" + score > 70
    const future = results
      .filter(x => x.signal === "Buy" && x.score > 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // กลุ่ม Hidden Gems: ราคา < 10 และ RSI เริ่มตัดขึ้น
    const hidden = results
      .filter(x => x.price < 10 && x.rsi > 45 && x.ema20 > x.ema50)
      .sort((a, b) => b.rsi - a.rsi)
      .slice(0, 10);

    // กลุ่ม AI Tech (หุ้น AI โดยตรง)
    const ai = results.filter(x =>
      ["PLTR", "NVDA", "MSFT", "GOOGL", "AMD", "META", "TSLA"].includes(x.symbol)
    );

    res.status(200).json({
      updated: new Date().toISOString(),
      emerging,
      future,
      hidden,
      ai,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
