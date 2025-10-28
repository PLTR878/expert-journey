// ✅ /pages/api/market-scan.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const symbols = [
    // === ตัวอย่างบางส่วน (สามารถเพิ่มภายหลังเป็น 7000 ตัวได้)
    "NVDA","AAPL","TSLA","MSFT","AMZN","META","GOOG","AMD","PLTR","SOFI",
    "WULF","DNA","BYND","OSCR","BBAI","ACHR","PATH","MVIS","SES","KSCP",
    "CCCX","RKLB","ASTS","CRSP","SLDP","ENVX","HASI","LWLG","SOUN","AXTI",
    "LAES","RXRX","NRGV","RIVN"
  ];

  const results = [];
  for (const sym of symbols) {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}`);
      const j = await r.json();
      const meta = j?.chart?.result?.[0]?.meta || {};
      const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;

      // ✅ คำนวณ indicator แบบง่าย (mock + random)
      const rsi = Math.min(100, Math.max(0, Math.random() * 40 + 30));
      const macd = Number((Math.random() * 2 - 1).toFixed(2));
      const adx = Math.floor(Math.random() * 40 + 10);
      const aiConfidence = Math.floor((rsi + adx + (macd > 0 ? 20 : 0)) / 2);

      const signal =
        rsi > 60 && macd > 0 ? "Buy" :
        rsi < 40 && macd < 0 ? "Sell" :
        "Hold";

      results.push({ symbol: sym, price, rsi, macd, adx, aiConfidence, signal });
    } catch (err) {
      console.log("❌", sym, err);
    }
  }

  // ✅ เก็บผลไว้ในไฟล์ JSON
  const filePath = path.join(process.cwd(), "public", "market-snapshot.json");
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

  res.status(200).json({ success: true, total: results.length, updated: new Date() });
}
