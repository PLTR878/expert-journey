// ✅ /pages/api/market-scan.js — OriginX AI Super Scanner V∞.4
// ดึงราคาจริงจาก Yahoo Finance + คำนวณ RSI / MACD / Signal จริง
import fs from "fs";
import path from "path";

function calculateRSI(closes, period = 14) {
  if (closes.length < period) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i < period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period || 1;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

// ✅ สัญญาณ MACD จาก EMA12 และ EMA26
function calculateEMA(values, period) {
  const k = 2 / (period + 1);
  let emaArray = [values[0]];
  for (let i = 1; i < values.length; i++) {
    emaArray.push(values[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

function calculateMACD(closes) {
  if (closes.length < 26) return 0;
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  return Number(macdLine.toFixed(2));
}

// ✅ รายชื่อหุ้น (สามารถเพิ่ม / ดึงทั้งหมดได้)
const symbols = [
  "NVDA","AAPL","TSLA","MSFT","AMZN","META","GOOG","AMD","PLTR","SOFI",
  "WULF","DNA","BYND","OSCR","BBAI","ACHR","PATH","MVIS","SES","KSCP",
  "CCCX","RKLB","ASTS","CRSP","SLDP","ENVX","HASI","LWLG","SOUN","AXTI",
  "LAES","RXRX","NRGV","RIVN"
];

export default async function handler(req, res) {
  const results = [];

  for (const sym of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();

      const meta = j?.chart?.result?.[0]?.meta || {};
      const data = j?.chart?.result?.[0]?.indicators?.quote?.[0];
      const closes = data?.close?.filter(Boolean) || [];

      const price = meta.regularMarketPrice ?? meta.previousClose ?? closes.at(-1) ?? 0;
      const rsi = calculateRSI(closes);
      const macd = calculateMACD(closes);
      const adx = Math.floor(Math.random() * 40 + 10); // จำลอง adx ไว้ก่อน
      const aiConfidence = Math.floor((rsi + adx + (macd > 0 ? 20 : 0)) / 2);

      let signal = "Hold";
      if (rsi > 60 && macd > 0) signal = "Buy";
      else if (rsi < 40 && macd < 0) signal = "Sell";

      let aiComment = "";
      if (signal === "Buy" && rsi < 70) aiComment = "💚 แนวโน้มขาขึ้น — ซื้อเพิ่มได้";
      else if (signal === "Sell" && rsi > 30) aiComment = "❤️ แนวโน้มอ่อนแรง — พิจารณาขาย";
      else aiComment = "🟡 ยังไม่ชัดเจน — รอดูต่อไป";

      results.push({
        symbol: sym,
        price: Number(price.toFixed(2)),
        rsi,
        macd,
        adx,
        aiConfidence,
        signal,
        aiComment,
      });
    } catch (err) {
      console.log("❌ Fetch error", sym, err);
    }
  }

  // ✅ เก็บผลไว้ในไฟล์ snapshot
  try {
    const filePath = path.join(process.cwd(), "public", "market-snapshot.json");
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  } catch (err) {
    console.log("⚠️ File write error:", err);
  }

  res.status(200).json({
    success: true,
    total: results.length,
    updated: new Date().toISOString(),
    results,
  });
}
