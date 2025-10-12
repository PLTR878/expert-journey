// /pages/api/screener.js
import { ema, rsi, macd } from '../../lib/indicators';

const DEFAULT_UNIVERSE = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AMD','SMCI','PLTR','INTC','MU','CRWD','PANW','AVGO','NOW','SHOP','UBER','JPM','XOM','NEE','GE','BA','CAT'
];

async function getRows(baseUrl, s, range='6mo', interval='1d') {
  const j = await fetch(`${baseUrl}/api/history?symbol=${encodeURIComponent(s)}&range=${range}&interval=${interval}`)
    .then(r => r.json())
    .catch(() => null);
  return j?.rows?.length ? j.rows : null;
}

function scoreShort(rows) { // 2–7 days
  const c = rows.map(r => r.c);
  const e20 = ema(c,20);
  const R = rsi(c,14);
  const M = macd(c,12,26,9).hist;

  if (!e20.length || !R.length || !M.length) return null;
  const last = rows.at(-1);
  const prev = rows.at(-2) || last;

  const emaUp = last.c > e20.at(-1) ? 1 : 0;
  const macdPos = Math.max(0, M.at(-1)) / (Math.abs(M.at(-1)) + 1e-6);
  const rsiPos = Math.max(0, (R.at(-1) - 50) / 20);
  const volBoost = Math.max(0, Math.min((last.v||1)/(prev.v||1), 3) - 1) / 2;

  const s = emaUp*0.35 + macdPos*0.4 + rsiPos*0.2 + volBoost*0.05;
  let signal = 'Hold';
  if (s >= 0.75) signal = 'Buy';
  else if (s <= 0.25) signal = 'Sell';

  return {
    symbol: rows.symbol,
    score: +s.toFixed(3),
    signal,
    lastClose: +last.c.toFixed(2),
    rsi: +R.at(-1).toFixed(1),
    ema20: +e20.at(-1).toFixed(2)
  };
}

export default async function handler(req, res) {
  try {
    const { horizon = 'short', universe, range = '6mo', interval = '1d' } = req.query || {};
    const symbols = Array.isArray(universe) && universe.length ? universe : DEFAULT_UNIVERSE;
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const out = [];

    for (const s of symbols) {
      const rows = await getRows(base, s, range, interval);
      if (!rows) continue;
      const m = scoreShort(rows);
      if (m) out.push({ symbol: s, ...m });
    }

    res.status(200).json({ results: out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'screener failed' });
  }
}
