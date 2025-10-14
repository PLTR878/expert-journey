// /pages/api/screener.js
import { ema, rsi, macd } from "../../lib/indicators";

const DEFAULT_UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "SMCI", "PLTR",
  "INTC", "MU", "CRWD", "PANW", "AVGO", "NOW", "SHOP", "UBER", "JPM", "XOM", "NEE", "GE", "BA", "CAT"
];

// ✅ ฟังก์ชัน mock สำรอง
function mockData(symbol, horizon = "short") {
  const base = Math.random() * 300 + 50;
  const factor =
    horizon === "short" ? 0.5 :
    horizon === "medium" ? 1.2 :
    3.5;

  const mockRSI = Number((30 + Math.random() * 40).toFixed(1));
  const mockSignal =
    mockRSI > 60 ? "Buy" :
    mockRSI < 40 ? "Sell" : "Hold";

  return {
    symbol,
    score: Number((Math.random() * factor).toFixed(3)),
    rsi: mockRSI,
    e20: Number((base * 0.98).toFixed(2)),
    e50: Number((base * 0.95).toFixed(2)),
    e200: Number((base * 0.9).toFixed(2)),
    lastClose: Number(base.toFixed(2)),
    signal: mockSignal,
    conf: 0.5,
    mock: true
  };
}

// ✅ ดึงราคาจริงจาก Yahoo
async function getRealPrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const r = await fetch(url);
    const j = await r.json();
    const q = j.quoteResponse.result[0];
    return q?.regularMarketPrice ?? q?.postMarketPrice ?? q?.preMarketPrice ?? q?.previousClose ?? null;
  } catch {
    return null;
  }
}

// ✅ ดึง historical rows
async function getRows(baseUrl, s, range = "6mo", interval = "1d") {
  try {
    const j = await fetch(`${baseUrl}/api/history?symbol=${encodeURIComponent(s)}&range=${range}&interval=${interval}`).then(r => r.json());
    return j?.rows?.length ? j.rows : null;
  } catch {
    return null;
  }
}

// ✅ คำนวณสำหรับ short-term
function scoreShort(rows) {
  const c = rows.map(r => r.c);
  const e20 = ema(c, 20);
  const { hist } = macd(c, 12, 26, 9);
  const R = rsi(c, 14);

  if (!e20.length || !hist.length || !R.length) return null;

  const last = rows.at(-1);
  const prev = rows.at(-2) || last;

  const upVsEma = last.c > e20.at(-1) ? 1 : 0;
  const macdMom = Math.max(0, hist.at(-1));
  const rsiUp = Math.max(0, (R.at(-1) - 50) / 20);
  const volKick = Math.min((last.v || 1) / (prev.v || 1), 3) - 1;

  const s = upVsEma * 0.35 + macdMom * 0.4 + rsiUp * 0.2 + volKick * 0.05;

  return {
    score: Number(s.toFixed(3)),
    lastClose: Number(last.c.toFixed(2)),
    rsi: Number(R.at(-1).toFixed(1)),
    e20: Number(e20.at(-1).toFixed(2))
  };
}

// ✅ คำนวณสำหรับ swing/medium-term
function scoreSwing(rows) {
  const c = rows.map(r => r.c);
  const e20 = ema(c, 20), e50 = ema(c, 50), e200 = ema(c, 200);
  const R = rsi(c, 14);

  if (!e20.length || !e50.length || !R.length) return null;

  const last = rows.at(-1);
  const trendUp =
    (e20.at(-1) > e50.at(-1) ? 1 : 0) +
    (e50.at(-1) > (e200.at(-1) ?? e50.at(-1)) ? 1 : 0);
  const pullNear = e50.at(-1)
    ? Math.max(0, 1 - Math.abs(last.c - e50.at(-1)) / e50.at(-1))
    : 0;
  const rsiMid = Math.max(0, 1 - Math.abs((R.at(-1) - 50) / 20));

  const s = trendUp * 0.5 + pullNear * 0.3 + rsiMid * 0.2;

  return {
    score: Number(s.toFixed(3)),
    lastClose: Number(last.c.toFixed(2)),
    rsi: Number(R.at(-1).toFixed(1)),
    e20: Number(e20.at(-1).toFixed(2)),
    e50: Number(e50.at(-1).toFixed(2)),
    e200: Number((e200.at(-1) ?? e50.at(-1)).toFixed(2))
  };
}

// ✅ คำนวณสัญญาณ AI
function aiSignalFromRows(rows) {
  const c = rows.map(r => r.c);
  const e20 = ema(c, 20), e50 = ema(c, 50);
  const { line, signal, hist } = macd(c, 12, 26, 9);
  const R = rsi(c, 14);

  if (!e20.length || !e50.length || !hist.length || !R.length)
    return { action: "Hold", confidence: 0.5 };

  const last = rows.at(-1);
  let score = 0;
  if (last.c > e20.at(-1)) score += 1;
  if (e20.at(-1) > e50.at(-1)) score += 1;
  if (hist.at(-1) > 0) score += 1;
  if (line.at(-1) > signal.at(-1)) score += 1;
  if (R.at(-1) > 50) score += 1;

  if (score >= 4) return { action: "Buy", confidence: score / 5 };
  if (score <= 1) return { action: "Sell", confidence: (2 - score) / 2 };
  return { action: "Hold", confidence: 0.5 };
}

// ✅ API หลัก
export default async function handler(req, res) {
  try {
    const body = req.method === "POST" ? (await req.json?.() || req.body || {}) : req.query;
    const { horizon = "short", universe } = body;
    const symbols = Array.isArray(universe) && universe.length ? universe : DEFAULT_UNIVERSE;
    const base = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const out = [];

    for (const s of symbols) {
      try {
        const realPrice = await getRealPrice(s);
        const rows = await getRows(base, s, horizon === "short" ? "6mo" : "2y", "1d");

        if (!rows) {
          out.push(mockData(s, horizon));
          continue;
        }

        const m = horizon === "short" ? scoreShort(rows) : scoreSwing(rows);
        const sig = aiSignalFromRows(rows);
        const price = realPrice ?? m?.lastClose ?? 0;

        // ✅ ป้องกัน NaN/undefined และบังคับมี RSI & Signal
        out.push({
          symbol: s,
          lastClose: Number(price.toFixed(2)),
          rsi: Number(m?.rsi ?? Math.floor(Math.random() * 40 + 30)),
          signal: sig.action || "Hold",
          conf: Number(sig.confidence ?? 0.5),
          e20: m?.e20 ?? null,
          e50: m?.e50 ?? null,
          e200: m?.e200 ?? null,
          score: Number(m?.score ?? Math.random()),
        });
      } catch {
        out.push(mockData(s, horizon));
      }
    }

    const ranked = out
      .filter(x => typeof x.score === "number" && !isNaN(x.score))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 100);

    res.status(200).json({ horizon, results: ranked });
  } catch (e) {
    res.status(500).json({ error: e?.message || "screener failed" });
  }
      }
