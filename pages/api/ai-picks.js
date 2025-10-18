// ✅ /pages/api/ai-picks.js — Full Market AI Analyzer (Batch Edition)
const CACHE_TTL = 1000 * 60 * 60; // cache 1 ชม.
if (!global.cache) global.cache = { picks: null, at: 0 };

function ema(arr, p) {
  if (arr.length < p) return arr[arr.length - 1];
  const k = 2 / (p + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function rsi(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
}

async function analyzeBatch(symbols) {
  const results = [];
  for (const s of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const q = d?.indicators?.quote?.[0];
      if (!q?.close?.length) continue;

      const c = q.close.filter(Boolean);
      const last = c.at(-1);
      const e20 = ema(c, 20);
      const e50 = ema(c, 50);
      const R = rsi(c);
      const trend = e20 > e50 ? "Uptrend" : "Downtrend";
      const signal = R < 35 ? "Buy" : R > 65 ? "Sell" : "Hold";
      const confidence = Math.round(Math.abs(R - 50) * 2);
      const score = Math.round((confidence + (trend === "Uptrend" ? 10 : -10)) / 2);

      results.push({
        symbol: s.symbol,
        price: last,
        ema20: e20,
        ema50: e50,
        rsi: R,
        trend,
        signal,
        confidence,
        score
      });
    } catch {}
  }
  return results;
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (global.cache.picks && now - global.cache.at < CACHE_TTL)
      return res.status(200).json(global.cache.picks);

    const base = "https://expert-journey-ten.vercel.app";
    const symbolsData = await fetch(`${base}/api/symbols`).then(r => r.json());
    const allSymbols = symbolsData.symbols || [];

    // ✅ แบ่ง batch ละ 300 ตัว
    const batchSize = 300;
    const results = [];
    for (let i = 0; i < allSymbols.length; i += batchSize) {
      const chunk = allSymbols.slice(i, i + batchSize);
      const part = await analyzeBatch(chunk);
      results.push(...part);
      await new Promise(r => setTimeout(r, 1000)); // delay 1 วิ กันโดนบล็อก
    }

    const data = {
      updated: new Date().toISOString(),
      count: results.length,
      results
    };

    global.cache = { picks: data, at: now };
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  }
