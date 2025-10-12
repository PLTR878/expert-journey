// /pages/api/screener.js
import { ema, rsi, macd } from '../../lib/indicators';

const DEFAULT_UNIVERSE = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AMD','SMCI','PLTR','INTC','MU','CRWD','PANW','AVGO','NOW','SHOP','UBER','JPM','XOM','NEE','GE','BA','CAT'
];

async function getRows(baseUrl, s, range='6mo', interval='1d') {
  const j = await fetch(`${baseUrl}/api/history?symbol=${encodeURIComponent(s)}&range=${range}&interval=${interval}`)
    .then(r => r.json())
    .catch(()=>null);
  return j?.rows?.length ? j.rows : null;
}

function scoreShort(rows) { // 2–7d momentum
  const c = rows.map(r=>r.c);
  const e20 = ema(c,20);
  const R = rsi(c,14);
  const M = macd(c,12,26,9).hist;

  if (!e20.length || !R.length || !M.length) return null;

  const last = rows.at(-1);
  const prev = rows.at(-2) || last;

  // สเกลคะแนน 0..1
  const emaUp   = last.c > e20.at(-1) ? 1 : 0;         // อยู่เหนือ EMA20
  const macdPos = Math.max(0, M.at(-1)) / (Math.abs(M.at(-1)) + 1e-6); // 0..1
  const rsiPos  = Math.max(0, (R.at(-1) - 50) / 20);   // 0..1 (>50 ดี)
  const volBoost= Math.max(0, Math.min((last.v||1)/(prev.v||1), 3) - 1) / 2; // 0..1

  const s = emaUp*0.35 + macdPos*0.4 + rsiPos*0.2 + volBoost*0.05;

  return { score: +s.toFixed(3), lastClose: last.c, rsi: +R.at(-1).toFixed(1), e20: +e20.at(-1).toFixed(2) };
}

function scoreSwing(rows) { // 1–2m trend+pullback
  const c = rows.map(r=>r.c);
  const e20 = ema(c,20), e50 = ema(c,50), e200 = ema(c,200);
  const R = rsi(c,14);
  if (!e20.length || !e50.length || !R.length) return null;

  const last = rows.at(-1);
  const trendUp = (e20.at(-1)>e50.at(-1)?1:0) + (e50.at(-1)>(e200.at(-1)??e50.at(-1))?1:0); // 0..2
  const pullNear = e50.at(-1) ? Math.max(0, 1 - Math.abs(last.c - e50.at(-1))/e50.at(-1)) : 0; // 0..1
  const rsiMid = Math.max(0, 1 - Math.abs((R.at(-1)-50)/20)); // 0..1
  const s = (trendUp/2)*0.5 + pullNear*0.3 + rsiMid*0.2;

  return {
    score: +s.toFixed(3),
    lastClose: last.c,
    rsi: +R.at(-1).toFixed(1),
    e20: +e20.at(-1).toFixed(2),
    e50: +e50.at(-1).toFixed(2),
    e200: +(e200.at(-1) ?? NaN).toFixed?.(2) ?? null,
  };
}

export default async function handler(req, res) {
  try {
    const body = req.method === 'POST' ? (await req.json?.() || req.body || {}) : req.query;
    const { horizon = 'short', universe, range = '6mo', interval = '1d' } = body;
    const symbols = Array.isArray(universe) && universe.length ? universe : DEFAULT_UNIVERSE;

    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    const out = [];
    for (const s of symbols) {
      const rows = await getRows(base, s, range, interval);
      if (!rows) continue;
      const m = horizon === 'short' ? scoreShort(rows)
              : horizon === 'medium' ? scoreSwing(rows)
              : { score: null };
      if (m) out.push({ symbol: s, ...m });
    }

    const ranked = out
      .filter(x => horizon === 'long' ? true : typeof x.score === 'number')
      .sort((a,b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 100);

    res.status(200).json({ horizon, results: ranked });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'screener failed' });
  }
    }
