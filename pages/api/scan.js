// ✅ /pages/api/scan.js — fixed version (Next.js 14.2.5 compatible)
export const config = { runtime: "nodejs" };

const yahoo = (s) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=6mo&interval=1d`;

async function getClose(symbol) {
  const r = await fetch(yahoo(symbol));
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  return res?.indicators?.quote?.[0]?.close?.filter((x) => x);
}

function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  let gains = 0,
    losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export default async function handler(req, res) {
  try {
    const offset = Number(req.query.offset || 0);
    const limit = Number(req.query.limit || 200);

    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/symbols`
      : `http://localhost:3000/api/symbols`;

    const { symbols } = await fetch(base).then((r) => r.json());
    const slice = symbols.slice(offset, offset + limit);

    const result = [];
    let scanned = 0;
    let lastSymbol = "";

    for (const sym of slice) {
      scanned++;
      lastSymbol = sym;
      try {
        const c = await getClose(sym);
        if (!c || c.length < 30) continue;
        const last = c[c.length - 1];
        const r = rsi(c);
        if (r >= 35 && r <= 60)
          result.push({ symbol: sym, price: last, rsi: r, signal: "Buy" });
      } catch (err) {
        console.log("Symbol error:", sym);
      }
    }

    res.status(200).json({
      results: result,
      batch: {
        offset,
        limit,
        scanned,
        lastSymbol,
        percent: ((offset + scanned) / symbols.length) * 100,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
