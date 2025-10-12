// /pages/api/screener.js
import { ema, rsi, macd } from '../../lib/indicators';

const DEFAULT_UNIVERSE = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AMD','SMCI','PLTR','INTC','MU','CRWD','PANW','AVGO','NOW','SHOP','UBER','JPM','XOM','NEE','GE','BA','CAT'
];

async function getRows(baseUrl, s, range='6mo', interval='1d') {
  const j = await fetch(`${baseUrl}/api/history?symbol=${encodeURIComponent(s)}&range=${range}&interval=${interval}`).then(r=>r.json());
  if (!j?.rows?.length) return null; return j.rows;
}

function scoreShort(rows) { // 2–7d momentum
  const c = rows.map(r=>r.c); const e20 = ema(c,20); const { hist } = macd(c,12,26,9); const R = rsi(c,14);
  if (!e20.length||!hist.length||!R.length) return null;
  const last = rows.at(-1); const prev = rows.at(-2) || last;
  const s = (last.c>e20.at(-1)?0.35:0) + (Math.max(0,hist.at(-1))*0.4) + (Math.max(0,(R.at(-1)-50)/20)*0.2) + (Math.min((last.v||1)/(prev.v||1),3)-1)*0.05;
  return { score: s, lastClose: last.c, rsi: R.at(-1), e20: e20.at(-1) };
}

function scoreSwing(rows) { // 1–2m trend+pullback
  const c = rows.map(r=>r.c); const e20=ema(c,20), e50=ema(c,50), e200=ema(c,200); const R=rsi(c,14);
  if (!e20.length||!e50.length||!R.length) return null;
  const last = rows.at(-1);
  const trendUp = (e20.at(-1)>e50.at(-1)?1:0) + (e50.at(-1)>(e200.at(-1)??e50.at(-1))?1:0);
  const pullNear = e50.at(-1)? Math.max(0, 1 - Math.abs(last.c - e50.at(-1))/e50.at(-1)):0;
  const rsiMid = Math.max(0, 1 - Math.abs((R.at(-1)-50)/20));
  const s = trendUp*0.5 + pullNear*0.3 + rsiMid*0.2;
  return { score: s, lastClose: last.c, rsi: R.at(-1), e20: e20.at(-1), e50: e50.at(-1), e200: e200.at(-1)??null };
}

export default async function handler(req, res) {
  try {
    const body = req.method==='POST' ? (await req.json?.()||req.body||{}) : req.query;
    const { horizon='short', universe, range='6mo', interval='1d' } = body;
    const symbols = Array.isArray(universe)&&universe.length? universe : DEFAULT_UNIVERSE;
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const out = [];
    for (const s of symbols) {
      try {
        const rows = await getRows(base, s, range, interval); if (!rows) continue;
        const m = horizon==='short' ? scoreShort(rows) : (horizon==='medium'? scoreSwing(rows) : { score:null });
        if (m) out.push({ symbol:s, ...m });
      } catch {}
    }
    const ranked = out.filter(x=> horizon==='long' ? true : typeof x.score==='number').sort((a,b)=>(b.score??0)-(a.score??0)).slice(0,100);
    res.status(200).json({ horizon, results: ranked });
  } catch (e) { res.status(500).json({ error: e?.message || 'screener failed' }); }
}
