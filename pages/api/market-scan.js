// ✅ AI Super Scanner — Smart-Batch v∞.36
import { analyzeAI } from "../../lib/aiAnalyzer.js";

export default async function handler(req, res) {
  const batch = parseInt(req.query.batch || "1");
  const maxPerBatch = 50; // 👈 ลดเหลือ 50 ตัวต่อ batch
  const symbols = [
    "AAPL","TSLA","NVDA","PLTR","SLDP","RXRX","SOFI","PATH","CRSP","ACHR",
    "BBAI","ENVX","SES","RKLB","ASTS","LWLG","WULF","DNA","BYND","HASI",
    "AXTI","LAES","NRGV","RIVN","SOUN","OSCR","CCCX"
  ];

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

  res.status(200).json({ batch, results });
}
