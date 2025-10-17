// /pages/api/scan.js

const SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA",
  "PLUG", "SMCI", "GWH", "SLDP", "AEHR", "BIO", "BIMI",
  "ACU", "ACV", "ACWI", "ZIM", "XFOR", "NRGV", "LWLG"
];

const SLEEP_MS = 250;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// RSI (14) คำนวณจริง
function calcRSI(values, period = 14) {
  if (!values || values.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = Math.max(diff, 0);
    const l = Math.max(-diff, 0);
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export default async function handler(req, res) {
  try {
    const {
      mode = "Any",
      rsiMin: rsiMinStr = "",
      rsiMax: rsiMaxStr = "",
      priceMin: pMinStr = "",
      priceMax: pMaxStr = "",
      cursor: cursorStr = "0"
    } = req.query;

    const rsiMin = rsiMinStr ? Number(rsiMinStr) : null;
    const rsiMax = rsiMaxStr ? Number(rsiMaxStr) : null;
    const priceMin = pMinStr ? Number(pMinStr) : null;
    const priceMax = pMaxStr ? Number(pMaxStr) : null;
    const cursor = parseInt(cursorStr) || 0;
    const batchSize = 10;

    const slice = SYMBOLS.slice(cursor, cursor + batchSize);
    const matches = [];

    for (const sym of slice) {
      const url = `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json().catch(() => null);
      const q = j?.chart?.result?.[0]?.indicators?.quote?.[0];
      const closes = q?.close?.filter(Number.isFinite) || [];
      const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice ?? closes.at(-1) ?? 0;
      if (!price || closes.length < 15) continue;

      const R = calcRSI(closes);
      const signal = R > 60 ? "Sell" : R < 40 ? "Buy" : "Hold";

      if (rsiMin !== null && R < rsiMin) continue;
      if (rsiMax !== null && R > rsiMax) continue;
      if (priceMin !== null && price < priceMin) continue;
      if (priceMax !== null && price > priceMax) continue;
      if (mode === "Buy" && signal !== "Buy") continue;
      if (mode === "Sell" && signal !== "Sell") continue;

      matches.push({ symbol: sym, price, rsi: Number(R.toFixed(1)), signal });
      await sleep(SLEEP_MS);
    }

    const nextCursor = cursor + batchSize;
    const done = nextCursor >= SYMBOLS.length;

    res.status(200).json({
      ok: true,
      nextCursor: done ? null : nextCursor,
      done,
      matches,
      progress: Math.round((nextCursor / SYMBOLS.length) * 100),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
