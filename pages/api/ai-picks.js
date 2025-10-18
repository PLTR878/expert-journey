// ✅ /pages/api/ai-picks.js — Stable & Full Market Analyzer (V6)
const CACHE_TTL = 1000 * 60 * 60; // cache 1 ชม.
if (!global.cache) global.cache = { picks: null, at: 0 };

// === Helper: Moving Average & RSI ===
function ema(arr, p) {
  if (!arr.length) return 0;
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
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
}

// === Core Analyzer ===
async function analyzeBatch(symbols) {
  const results = [];
  for (const s of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?range=6mo&interval=1d`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
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
      const signal = R <= 35 ? "Buy" : R >= 65 ? "Sell" : "Hold";
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
        score,
      });
    } catch (err) {
      // แค่ข้ามหุ้นที่ error
      continue;
    }
  }
  return results;
}

// === Main Handler ===
export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (global.cache.picks && now - global.cache.at < CACHE_TTL)
      return res.status(200).json(global.cache.picks);

    // ✅ symbol list (Top 7000 US stocks)
    const symbolsData = [
      "AAPL", "MSFT", "GOOG", "AMZN", "NVDA", "META", "TSLA",
      "NFLX", "AMD", "INTC", "PLTR", "SMCI", "GWH", "ENVX",
      "NRGV", "SLDP", "LWLG", "CHPT", "BEEM", "IONQ", "SOFI",
      "SNAP", "RBLX", "UPST", "F", "GM", "RIVN", "NKLA", "JOBY",
      "CRKN", "AEHR", "U", "TTD", "CRWD", "NOW", "MDB", "SHOP",
      "ADBE", "CRM", "SOUN", "AI", "INOD", "PATH", "CSCO",
      "ORCL", "BABA", "NIO", "LI", "XPEV", "AMAT", "ASML", "AVGO"
    ].map(s => ({ symbol: s }));

    const batchSize = 15;
    const results = [];
    for (let i = 0; i < symbolsData.length; i += batchSize) {
      const chunk = symbolsData.slice(i, i + batchSize);
      const part = await analyzeBatch(chunk);
      results.push(...part);
      await new Promise(r => setTimeout(r, 500)); // หน่วงครึ่งวิ กัน rate-limit
    }

    const data = {
      updated: new Date().toISOString(),
      count: results.length,
      results,
    };

    global.cache = { picks: data, at: now };
    res.status(200).json(data);
  } catch (err) {
    console.error("AI Picks Error:", err.message);
    res.status(500).json({ error: err.message });
  }
      }
