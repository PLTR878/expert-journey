// ✅ AI Screener — Full US Market (NASDAQ + NYSE) with /api/symbols support
// ใช้ข้อมูลจาก /api/symbols (ของโปรเจคคุณเอง) + วิเคราะห์ RSI/EMA/Trend + Cache + Target/Confidence

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 นาที

if (!globalThis.__AI_CACHE__)
  globalThis.__AI_CACHE__ = { symbols: null, symbolsAt: 0, chart: new Map(), aiPages: new Map() };
const C = globalThis.__AI_CACHE__;

// 🧩 โหลดหุ้นจาก /api/symbols (ใช้ cache ด้วย)
async function fetchUniverse() {
  const now = Date.now();
  if (C.symbols && now - C.symbolsAt < CACHE_TTL_MS) return C.symbols;

  try {
    const url = "https://expert-journey-five.vercel.app/api/symbols";
    const r = await fetch(url);
    const j = await r.json();
    const symbols = j.symbols?.map((x) => x.symbol)?.filter(Boolean) || [];

    if (!symbols.length) throw new Error("No stock list");

    C.symbols = symbols;
    C.symbolsAt = now;
    return symbols;
  } catch (err) {
    console.error("❌ fetchUniverse error:", err);
    throw new Error("No stock list.");
  }
}

// 🧩 ดึงกราฟจาก Yahoo Finance
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

    // ✅ เพิ่มราคาปัจจุบันให้ตรงกับ TradingView
    const closes = q.close.filter(Boolean);
    const price = d?.meta?.regularMarketPrice || closes.at(-1);
    const data = { closes, price };
    C.chart.set(sym, data);
    return data;
  } catch {
    return { closes: [], price: 0 };
  }
}

// 🧠 ตัวคำนวณ RSI + EMA + สัญญาณ
function ema(arr, p) {
  if (!arr.length) return 0;
  const k = 2 / (p + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

// ✅ RSI พร้อม fallback (ป้องกันกรณีข้อมูลไม่พอ)
function rsi(c, p = 14) {
  if (c.length < p + 1) {
    const last = c.at(-1);
    const prev = c.at(-2) || last;
    const change = ((last - prev) / prev) * 100;
    return Math.max(0, Math.min(100, 50 + change)); // จำกัดไม่เกิน 0–100
  }
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

// ✅ ฟังก์ชันคำนวณสัญญาณ (เพิ่ม Target + Confidence)
function compute({ closes, price }) {
  if (!closes.length) return null;
  const last = price || closes.at(-1);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const theRsi = rsi(closes);
  if (!theRsi) return null;

  const score =
    50 +
    (ema20 > ema50 ? 10 : -10) +
    (theRsi > 55 ? 5 : -5) +
    (last > ema20 ? 5 : -5);

  let sig = "Hold";
  if (score > 65) sig = "Buy";
  if (score < 40) sig = "Sell";

  // ✅ เพิ่ม Target และระดับความมั่นใจ (AI Confidence)
  const target = last * (score > 65 ? 1.08 : score < 40 ? 0.92 : 1.0);
  const confidence = Math.min(100, Math.abs(score - 50) * 2);

  return { last, ema20, ema50, rsi: theRsi, score, signal: sig, target, confidence };
}

// ⚙️ วิเคราะห์เป็นชุด (batch)
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
      } catch {}
    }
  });
  await Promise.all(workers);
  return results;
}

// 🚀 Handler หลัก
export default async function handler(req, res) {
  try {
    const { limit = "100", offset = "0" } = req.query;
    const L = parseInt(limit);
    const O = parseInt(offset);
    const key = `${O}:${L}`;
    const now = Date.now();

    // ใช้ cache รายหน้า
    const hit = C.aiPages.get(key);
    if (hit && now - hit.at < CACHE_TTL_MS)
      return res.status(200).json({
        count: hit.results.length,
        results: hit.results,
        cached: true,
      });

    // ✅ โหลดหุ้นจาก /api/symbols
    const universe = await fetchUniverse();
    const batch = universe.slice(O, O + L);

    // ✅ วิเคราะห์สัญญาณ
    const results = await analyzeBatch(batch);
    const sorted = results.sort((a, b) => b.score - a.score);

    // ✅ เก็บ cache
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
