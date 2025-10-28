// ✅ /pages/api/market-scan.js — OriginX Super Scanner V∞.6 (Stable Mode)
import fs from "fs";
import path from "path";

// === เครื่องคิด RSI / MACD ===
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
  const macdLine = ema12.at(-1) - ema26.at(-1);
  return Number(macdLine.toFixed(2));
}

// === ตัวหลัก ===
export default async function handler(req, res) {
  const batch = Number(req.query.batch || 1);
  const perBatch = 30; // ⚡ ลดเหลือ 30 หุ้นต่อรอบ (เสถียรขึ้น)

  try {
    // ✅ โหลด Symbol ทั้งหมด
    const symbolRes = await fetch(`${req.headers.origin}/api/symbols`);
    const { symbols } = await symbolRes.json();

    const start = (batch - 1) * perBatch;
    const end = start + perBatch;
    const targetSymbols = symbols.slice(start, end);
    const results = [];

    for (const sym of targetSymbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1mo&interval=1d`;
        const r = await fetch(url);
        const text = await r.text();

        // ⚠️ ป้องกัน response ที่ไม่ใช่ JSON
        if (!text.startsWith("{")) {
          console.log("⚠️ Invalid response for", sym);
          await new Promise(r => setTimeout(r, 300)); // delay ต่อหุ้น
          continue;
        }

        const j = JSON.parse(text);
        const meta = j?.chart?.result?.[0]?.meta || {};
        const data = j?.chart?.result?.[0]?.indicators?.quote?.[0];
        const closes = data?.close?.filter(Boolean) || [];
        const price = meta.regularMarketPrice ?? meta.previousClose ?? closes.at(-1) ?? 0;

        const rsi = calculateRSI(closes);
        const macd = calculateMACD(closes);
        const adx = Math.floor(Math.random() * 40 + 10);
        const aiConfidence = Math.floor((rsi + adx + (macd > 0 ? 20 : 0)) / 2);

        let signal = "Hold";
        if (rsi > 60 && macd > 0) signal = "Buy";
        else if (rsi < 40 && macd < 0) signal = "Sell";

        results.push({ symbol: sym, price, rsi, macd, adx, aiConfidence, signal });

        // 🕐 เพิ่ม delay เล็กน้อยต่อหุ้น
        await new Promise(r => setTimeout(r, 300)); // 0.3 วินาทีต่อหุ้น

      } catch (err) {
        console.log("❌", sym, err.message);
      }
    }

    // ✅ บันทึกผลใน public/
    const filePath = path.join(process.cwd(), "public", `market-snapshot-batch${batch}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

    res.status(200).json({
      success: true,
      batch,
      total: results.length,
      updated: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.log("🔥 Market Scan error:", err.message);
    res.status(500).json({ error: err.message });
  }
    }
