// /pages/api/scan-batch.js
const SLEEP_MS = 240; // กัน 429
const BATCH_SIZE_DEFAULT = 80;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ↓ ถ้ามีไฟล์นี้อยู่แล้วให้ใช้ของเดิมได้เลย (array ของสัญลักษณ์หุ้น US)
// วางไฟล์ไว้ที่ /data/symbols-us.json เป็นรูปแบบ ["AAPL","MSFT",...]
let SYMBOLS = [];
try {
  SYMBOLS = require("../../data/symbols-us.json");
} catch (_) {
  // fallback สั้นๆ กันพัง (ทดลอง)
  SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "PLUG", "SMCI", "GWH", "SLDP"];
}

// ===== RSI (14) ง่ายๆ จากราคา closing =====
function rsi(values, period = 14) {
  if (!values || values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

async function fetchCloses(symbol) {
  const url = `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
  const r = await fetch(url);
  const j = await r.json().catch(() => null);
  const q = j?.chart?.result?.[0]?.indicators?.quote?.[0];
  const c = q?.close?.filter(Number.isFinite) || [];
  const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice ?? (c.length ? c.at(-1) : null);
  return { closes: c, price };
}

export default async function handler(req, res) {
  try {
    const {
      cursor: cursorStr = "0",
      batchSize: bsStr = "",
      mode = "Any",           // Any | Buy | Sell
      rsiMin: rsiMinStr = "",
      rsiMax: rsiMaxStr = "",
      priceMin: pMinStr = "",
      priceMax: pMaxStr = "",
    } = req.query;

    const total = SYMBOLS.length;
    const cursor = Math.max(0, parseInt(cursorStr, 10) || 0);
    const batchSize = Math.min(200, parseInt(bsStr, 10) || BATCH_SIZE_DEFAULT);

    const rsiMin = rsiMinStr !== "" ? Number(rsiMinStr) : null;
    const rsiMax = rsiMaxStr !== "" ? Number(rsiMaxStr) : null;
    const priceMin = pMinStr !== "" ? Number(pMinStr) : null;
    const priceMax = pMaxStr !== "" ? Number(pMaxStr) : null;

    const slice = SYMBOLS.slice(cursor, cursor + batchSize);

    const matches = [];
    const logs = [];
    let lastSymbol = "";

    for (let i = 0; i < slice.length; i++) {
      const sym = slice[i];
      lastSymbol = sym;

      try {
        const { closes, price } = await fetchCloses(sym);
        await sleep(SLEEP_MS);

        if (!closes?.length || !Number.isFinite(price)) {
          logs.push(`⚠️ ${sym} - no data`);
          continue;
        }

        const R = rsi(closes, 14);
        const signal = R > 60 ? "Sell" : R < 40 ? "Buy" : "Hold";

        // filter ตามเงื่อนไข
        if (rsiMin !== null && R < rsiMin) continue;
        if (rsiMax !== null && R > rsiMax) continue;
        if (priceMin !== null && price < priceMin) continue;
        if (priceMax !== null && price > priceMax) continue;
        if (mode === "Buy" && signal !== "Buy") continue;
        if (mode === "Sell" && signal !== "Sell") continue;

        matches.push({ symbol: sym, price: Number(price.toFixed(2)), rsi: Number(R.toFixed(1)), signal });
        logs.push(`🔎 ${sym} — $${price.toFixed(2)} | RSI ${R.toFixed(1)} | ${signal}`);
      } catch (e) {
        logs.push(`⚠️ ${sym} error: ${e.message?.slice(0, 60) || "fail"}`);
      }
    }

    const checked = Math.min(cursor + slice.length, total);
    const progress = Math.round((checked / total) * 100);
    const done = checked >= total;
    const nextCursor = done ? null : checked;

    res.status(200).json({
      ok: true,
      progress,
      total,
      checked,
      lastSymbol,
      matches,
      logs,
      nextCursor,
      done,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
    }
