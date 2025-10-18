// ✅ AI Screener — Full US Market (Fixed & Stable Version)
const CACHE_TTL_MS = 1000 * 60 * 30;

if (!globalThis.__AI_CACHE__)
  globalThis.__AI_CACHE__ = { symbols: null, symbolsAt: 0, chart: new Map(), aiPages: new Map() };
const C = globalThis.__AI_CACHE__;

async function fetchUniverse() {
  const now = Date.now();
  if (C.symbols && now - C.symbolsAt < CACHE_TTL_MS) return C.symbols;

  try {
    const url = "https://expert-journey-five.vercel.app/api/symbols";
    const r = await fetch(url);
    const j = await r.json();
    const symbols = j.symbols?.map(x => x.symbol)?.filter(Boolean) || [];
    if (!symbols.length) throw new Error("No stock list");

    C.symbols = symbols;
    C.symbolsAt = now;
    return symbols;
  } catch (err) {
    console.error("❌ fetchUniverse error:", err);
    throw new Error("No stock list.");
  }
}

async function fetchChart(sym) {
  try {
    if (C.chart.has(sym)) return C.chart.get(sym);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("Yahoo error");

    const j = await r.json();
    const d = j?.chart?.result?.[0];
    const q = d?.indicators?.quote?.[0];
    if (!q?.close?.length) throw new Error("No chart data");

    const closes = q.close.filter(Boolean);
    const price = d?.meta?.regularMarketPrice || closes.slice(-1)[0];
    const data = { closes, price };
    C.chart.set(sym, data);
    return data;
  } catch (e) {
    console.warn(`⚠️ Chart fetch fail: ${sym}`);
    return { closes: [], price: 0 };
  }
}

function ema(arr, p) {
  if (!arr.length) return 0;
  const k = 2 / (p + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function rsi(c, p = 14) {
  if (c.length < p + 1) {
    const last = c.slice(-1)[0];
    const prev = c.slice(-2)[0] || last;
    const change = ((last - prev) / prev) * 100;
    return Math.max(0, Math.min(100, 50 + change));
  }
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0) g += d; else l -= d;
  }
  g /= p; l /= p;
  const rs = l === 0 ? 0 : g / l;
  return 100 - 100 / (1 + rs);
}

function compute({ closes, price }) {
  if (!closes.length) return null;
  const last = price || closes.slice(-1)[0];
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const theRsi = rsi(closes);

  const score =
    50 +
    (ema20 > ema50 ? 10 : -10) +
    (theRsi > 55 ? 5 : -5) +
    (last > ema20 ? 5 : -5);

  let sig = "Hold";
  if (score > 65) sig = "Buy";
  if (score < 40) sig = "Sell";

  const confidence = Math.min(100, Math.abs(score - 50) * 2);
  const target =
    sig === "Buy"
      ? last * 1.08
      : sig === "Sell"
      ? last * 0.92
      : last;

  const predictedMove =
    sig === "Buy"
      ? +((theRsi - 50) / 10).toFixed(2)
      : sig === "Sell"
      ? -((theRsi - 50) / 12).toFixed(2)
      : 0;

  return {
    last,
    ema20,
    ema50,
    rsi: +theRsi.toFixed(2),
    score,
    signal: sig,
    target: +target.toFixed(2),
    confidence: +confidence.toFixed(2),
    predictedMove,
  };
}

async function analyzeBatch(symbols) {
  const results = [];
  const maxParallel = 8;
  const queue = [...symbols];
  const workers = Array.from({ length: maxParallel }, async () => {
    while (queue.length) {
      const sym = queue.pop();
      try {
        const chart = await fetchChart(sym);
        const sig = compute(chart);
        if (sig) results.push({ symbol: sym, ...sig });
      } catch (err) {
        console.warn(`⚠️ ${sym} analyze fail`);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export default async function handler(req, res) {
  try {
    const { limit = "100", offset = "0" } = req.query;
    const L = parseInt(limit);
    const O = parseInt(offset);
    const key = `${O}:${L}`;
    const now = Date.now();

    const hit = C.aiPages.get(key);
    if (hit && now - hit.at < CACHE_TTL_MS)
      return res.status(200).json({
        count: hit.results.length,
        results: hit.results,
        cached: true,
      });

    const universe = await fetchUniverse();
    const batch = universe.slice(O, O + L);
    const results = await analyzeBatch(batch);
    const sorted = results.sort((a, b) => b.confidence - a.confidence);
    C.aiPages.set(key, { at: now, results: sorted });

    res.status(200).json({
      count: sorted.length,
      results: sorted,
      cached: false,
    });
  } catch (e) {
    console.error("AI Picks Error:", e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
                             }
