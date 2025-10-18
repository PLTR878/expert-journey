// ✅ /pages/api/ai-picks.js
// วิเคราะห์หุ้นทั้งตลาดอเมริกา พร้อมสัญญาณ AI
const CACHE_TTL = 1000 * 60 * 60; // cache 1 ชม.
if (!global.cache) global.cache = { picks: null, at: 0 };

// ===== Helper =====
function ema(prices, p) {
  if (prices.length < p) return prices[prices.length - 1];
  const k = 2 / (p + 1);
  let e = prices[0];
  for (let i = 1; i < prices.length; i++) e = prices[i] * k + e * (1 - k);
  return e;
}

function rsi(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }
  const rs = gain / (loss || 1);
  return 100 - 100 / (1 + rs);
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (global.cache.picks && now - global.cache.at < CACHE_TTL)
      return res.status(200).json(global.cache.picks);

    const symbolsData = await fetch("https://expert-journey-ten.vercel.app/api/symbols").then(r => r.json());
    const list = symbolsData.symbols || [];

    const results = [];
    for (const s of list.slice(0, 800)) { // จำกัด 800 ตัวก่อน
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
      } catch (err) {
        console.log("AI error", s.symbol);
      }
    }

    const data = { count: results.length, results, updated: new Date().toISOString() };
    global.cache = { picks: data, at: now };

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
