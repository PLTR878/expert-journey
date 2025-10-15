// /pages/api/ai-picks.js
// ✅ AI Scanner — Real Stocks Only + Progress Counter

const STQS = [
  "https://stooq.com/t/s/us_nasdaq.csv",
  "https://stooq.com/t/s/us_nyse.csv",
];

const CACHE_TTL_MS = 1000 * 60 * 30; // cache 30 นาที

if (!globalThis.__AI_CACHE__)
  globalThis.__AI_CACHE__ = {
    tickers: null,
    tickersAt: 0,
    chart: new Map(),
    aiPages: new Map(),
    progress: { total: 0, done: 0 },
  };
const C = globalThis.__AI_CACHE__;

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

async function fetchUniverse() {
  const now = Date.now();
  if (C.tickers && now - C.tickersAt < CACHE_TTL_MS) return C.tickers;
  try {
    const csvs = await Promise.allSettled(
      STQS.map((u) => fetch(u).then((r) => r.text()))
    );
    const valid = csvs.filter((x) => x.status === "fulfilled").map((x) => x.value);
    let tickers = Array.from(new Set(valid.flatMap(csvToTickers)));
    tickers = tickers.slice(0, 7000);
    if (!tickers.length) return [];
    C.tickers = tickers;
    C.tickersAt = now;
    return tickers;
  } catch {
    return [];
  }
}

async function fetchChart(sym) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    const j = await r.json();
    const d = j?.chart?.result?.[0];
    const q = d?.indicators?.quote?.[0];
    const closes = q?.close?.filter(Boolean) || [];
    if (closes.length < 15) throw new Error();
    return { closes };
  } catch {
    return null;
  }
}

function ema(arr, p) {
  const k = 2 / (p + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}
function rsi(c, p = 14) {
  if (c.length < p + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0) g += d; else l -= d;
  }
  g /= p; l /= p;
  const rs = l === 0 ? 0 : g / l;
  return Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
}
function compute({ closes }) {
  const last = closes.at(-1);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const theRsi = rsi(closes);
  const score =
    50 + (ema20 > ema50 ? 10 : -10) + (theRsi > 55 ? 5 : -5) + (last > ema20 ? 5 : -5);
  let sig = "Hold";
  if (score > 65) sig = "Buy";
  if (score < 40) sig = "Sell";
  return { last, ema20, ema50, rsi: theRsi, score, signal: sig };
}

async function analyzeBatch(symbols) {
  const results = [];
  const maxParallel = 8;
  const queue = [...symbols];
  C.progress.total = queue.length;
  C.progress.done = 0;

  const workers = Array.from({ length: maxParallel }, async () => {
    while (queue.length) {
      const sym = queue.pop();
      const chart = await fetchChart(sym);
      if (!chart) continue;
      const sig = compute(chart);
      if (sig) results.push({ symbol: sym, ...sig });
      C.progress.done++; // ✅ update progress
    }
  });
  await Promise.all(workers);
  return results;
}

// 🧠 Handler
export default async function handler(req, res) {
  try {
    const { limit = "100", offset = "0", nocache } = req.query;
    const L = parseInt(limit);
    const O = parseInt(offset);
    const key = `${O}:${L}`;
    const now = Date.now();

    if (!nocache) {
      const hit = C.aiPages.get(key);
      if (hit && now - hit.at < CACHE_TTL_MS) {
        return res.status(200).json(hit.results);
      }
    }
    if (nocache) {
      C.aiPages.clear();
      C.chart.clear();
    }

    const universe = await fetchUniverse();
    if (!universe.length) return res.status(500).json({ error: "No stock list." });

    const batch = universe.slice(O, O + L);
    const results = await analyzeBatch(batch);
    const sorted = results.sort((a, b) => b.score - a.score);
    C.aiPages.set(key, { at: now, results: sorted });

    res.status(200).json(sorted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// 🧩 API แยกสำหรับดึง progress
export const config = { api: { bodyParser: false } };
export async function progressHandler(req, res) {
  const { total, done } = C.progress;
  const pct = total ? ((done / total) * 100).toFixed(1) : 0;
  res.status(200).json({ total, done, percent: pct });
}
