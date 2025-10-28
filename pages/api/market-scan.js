// ✅ AI Super Scanner — Full Market v∞.40
import { analyzeAI } from "../../utils/aiCore.js";

export default async function handler(req, res) {
  const batch = parseInt(req.query.batch || "1");
  const maxPerBatch = 50; // 👈 สแกนครั้งละ 50 ตัว

  try {
    // ✅ ดึงรายชื่อหุ้นทั้งหมดจาก /api/symbols
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://your-vercel-domain.vercel.app"; // เปลี่ยนเป็นโดเมนจริงของพี่
    const resList = await fetch(`${baseUrl}/api/symbols`);
    const j = await resList.json();
    const symbols = j.symbols || [];

    // ถ้าไม่มี symbol เลย fallback กลับไปใช้ตัวอย่าง
    if (symbols.length === 0) {
      console.warn("⚠️ ใช้ fallback list แทน");
      symbols.push(
        "AAPL","TSLA","NVDA","PLTR","SLDP","RXRX","SOFI","PATH","CRSP","ACHR",
        "BBAI","ENVX","SES","RKLB","ASTS","LWLG","WULF","DNA","BYND","HASI"
      );
    }

    const start = (batch - 1) * maxPerBatch;
    const selected = symbols.slice(start, start + maxPerBatch);
    const results = [];

    for (const sym of selected) {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1mo`
        );
        const d = await r.json();
        const c = d.chart?.result?.[0];
        if (!c) continue;

        const quote = c.indicators.quote[0];
        const prices = quote.close.filter(Boolean);
        const highs = quote.high.filter(Boolean);
        const lows = quote.low.filter(Boolean);
        const vols = quote.volume.filter(Boolean);

        const ai = analyzeAI(prices, highs, lows, vols);
        results.push({
          symbol: sym,
          rsi: Math.round(ai.rsi),
          signal: ai.signal,
          aiScore: ai.aiScore,
        });

        // ⏳ ป้องกันโดน Yahoo block
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.warn(`⚠️ ${sym}: ${e.message}`);
      }
    }

    res.status(200).json({ batch, count: results.length, results });
  } catch (err) {
    console.error("❌ Market Scan Error:", err);
    res.status(500).json({ error: err.message });
  }
}
