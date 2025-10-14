// /pages/api/ai-picks.js
// ✅ AI Scanner — Full NASDAQ + NYSE (Smart + Async + Fast)

const STQS = [
  "https://stooq.com/t/s/us_nasdaq.csv",
  "https://stooq.com/t/s/us_nyse.csv",
];

const CACHE_TTL_MS = 1000 * 60 * 30;
if (!globalThis.__AI_CACHE__)
  globalThis.__AI_CACHE__ = { tickers: null, tickersAt: 0, chart: new Map() };
const C = globalThis.__AI_CACHE__;

// 🧩 แปลง CSV → สัญลักษณ์หุ้น
function csvToTickers(csv) {
  const lines = csv.trim().split(/\r?\n/);
  lines.shift();
  const list = [];
  for (const line of lines) {
    const s = line.split(",")[0]?.trim();
    if (s && /^[A-Z]{1,6}$/.test(s)) list.push(s);
  }
  return list;
}

// 🧩 โหลด Universe (หุ้นทั้งหมด)
async function fetchUniverse() {
  const now = Date.now();
  if (C.tickers && now - C.tickersAt < CACHE_TTL_MS) return C.tickers;
  const csvs = await Promise.all(STQS.map((u) => fetch(u).then((r) => r.text())));
  const tickers = Array.from(new Set(csvs.flatMap(csvToTickers))).slice(0, 3000);
  C.tickers = tickers;
  C.tickersAt = now;
  return tickers;
}

// 🧩 ดึงกราฟจาก Yahoo
async function fetchChart(sym) {
  try {
    if (C.chart.has(sym)) return C.chart.get(sym);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
    const r = await fetch(url);
    const j = await r.json();
    const d = j?.chart?.result?.[0];
    const closes = d?.indicators?.quote?.[0]?.close || [];
    const vols = d?.indicators?.quote?.[0]?.volume || [];
    const data = { closes, vols };
    C.chart.set(sym, data);
    return data;
  } catch {
    return { closes: [], vols: [] };
  }
}

// 🧠 คำนวณ EMA, RSI, สัญญาณ AI
function ema(arr, p) {
  if (!arr.length) return 0;
  const k = 2 / (p + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function rsi(c, p = 14) {
  if (c.length < p + 1) return null;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0) g += d;
    else l -= d;
  }
  g /= p; l /= p;
  const rs = l === 0 ? 0 : g / l;
  return 100 - 100 / (1 + rs);
}

function compute({ closes, vols }) {
  if (!closes.length) return null;
  const last = closes.at(-1);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const theRsi = rsi(closes);
  const hi = Math.max(...closes.slice(-100));
  const lo = Math.min(...closes.slice(-100));
  const score =
    50 +
    (ema20 > ema50 ? 10 : -10) +
    (theRsi > 55 ? 5 : -5) +
    (last > ema20 ? 5 : -5);
  let sig = "Hold";
  if (score > 65) sig = "Buy";
  if (score < 40) sig = "Sell";
  return { last, ema20, ema50, rsi: theRsi, hi, lo, score, signal: sig };
}

// 🧩 โหลดแบบ parallel (async queue)
async function analyzeBatch(symbols, limit = 10) {
  const results = [];
  const queue = [...symbols];
  const maxParallel = 10;
  const workers = Array.from({ length: maxParallel }, async () => {
    while (queue.length) {
      const sym = queue.pop();
      if (!sym) continue;
      const chart = await fetchChart(sym);
      const sig = compute(chart);
      if (sig && sig.rsi && sig.score) results.push({ symbol: sym, ...sig });
    }
  });
  await Promise.all(workers);
  return results;
}

// 🧠 API Handler
export default async function handler(req, res) {
  try {
    const { limit = "80", offset = "0" } = req.query;
    const L = parseInt(limit);
    const O = parseInt(offset);

    const universe = await fetchUniverse();
    const batch = universe.slice(O, O + L);

    const results = await analyzeBatch(batch, L);
    results.sort((a, b) => b.score - a.score);

    res.status(200).json({ count: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
