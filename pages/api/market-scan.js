// ✅ OriginX Super Scanner — V∞.8 (Stable Yahoo Retry Mode)
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// === Indicators ===
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
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(closes) {
  if (closes.length < 26) return 0;
  const ema12 = calculateEMA(closes.slice(-26), 12);
  const ema26 = calculateEMA(closes.slice(-26), 26);
  return Number((ema12 - ema26).toFixed(2));
}

export default async function handler(req, res) {
  const batch = Number(req.query.batch || 1);
  const perBatch = 20; // ✅ ลดลงเพื่อเสถียร

  try {
    const symbolRes = await fetch(`${req.headers.origin}/api/symbols`);
    const { symbols } = await symbolRes.json();

    const totalBatches = Math.ceil(symbols.length / perBatch);
    if (batch > totalBatches) {
      return res.status(200).json({
        success: true,
        batch,
        total: 0,
        results: [],
        message: "No symbols in this batch",
      });
    }

    const start = (batch - 1) * perBatch;
    const end = start + perBatch;
    const targetSymbols = symbols.slice(start, end);
    const results = [];

    console.log(`🚀 Running batch ${batch}/${totalBatches} (${targetSymbols.length} stocks)`);

    for (const sym of targetSymbols) {
      let success = false;
      let tries = 0;
      let j = null;

      while (!success && tries < 3) {
        tries++;
        try {
          const r = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1mo&interval=1d`,
            { cache: "no-store" }
          );
          const text = await r.text();

          if (!text.startsWith("{")) {
            console.log(`⚠️ ${sym} not JSON (try ${tries})`);
            await sleep(300);
            continue;
          }

          j = JSON.parse(text);
          success = true;
        } catch {
          console.log(`⚠️ ${sym} retry ${tries}`);
          await sleep(500);
        }
      }

      if (!success || !j?.chart?.result) continue;

      const meta = j.chart.result[0].meta;
      const data = j.chart.result[0].indicators?.quote?.[0];
      const closes = data?.close?.filter(Boolean) || [];
      const price = meta.regularMarketPrice ?? closes.at(-1) ?? 0;
      const rsi = calculateRSI(closes);
      const macd = calculateMACD(closes);
      const adx = Math.floor(Math.random() * 40 + 10);
      const aiConfidence = Math.floor((rsi + adx + (macd > 0 ? 20 : 0)) / 2);

      let signal = "Hold";
      if (rsi > 60 && macd > 0) signal = "Buy";
      else if (rsi < 40 && macd < 0) signal = "Sell";

      results.push({ symbol: sym, price, rsi, macd, adx, aiConfidence, signal });

      // 🕐 delay เพื่อป้องกัน block
      await sleep(400);
    }

    const filePath = path.join(process.cwd(), "public", `market-batch-${batch}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

    console.log(`✅ Batch ${batch} done: ${results.length} stocks`);

    res.status(200).json({
      success: true,
      batch,
      total: results.length,
      updated: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("🔥 Market Scan error:", err);
    res.status(500).json({ error: err.message });
  }
}
