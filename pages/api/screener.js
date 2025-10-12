// /pages/api/screener.js
import { ema, rsi, macd } from '../../lib/indicators';

const DEFAULT_UNIVERSE = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AMD','SMCI','PLTR','INTC','MU','CRWD','PANW','AVGO','NOW','SHOP','UBER','JPM','XOM','NEE','GE','BA','CAT'
];

async function getRows(baseUrl, s, range='6mo', interval='1d') {
  const j = await fetch(`${baseUrl}/api/history?symbol=${encodeURIComponent(s)}&range=${range}&interval=${interval}`).then(r=>r.json());
  return j?.rows?.length ? j.rows : null;
}

async function getFund(baseUrl, s) {
  // สมมติคุณมี /api/fundamentals.js อยู่แล้ว
  // ควรคืนค่า { revenueCAGR5, epsCAGR5, grossMargin, opMargin, roic, debtToEquity, fcfMargin, pe, ps }
  const j = await fetch(`${baseUrl}/api/fundamentals?symbol=${encodeURIComponent(s)}`).then(r=>r.json()).catch(()=>null);
  return j || null;
}

/** ---------- โหมด 2–7 วัน ---------- */
function scoreShort(rows) {
  const c = rows.map(r=>r.c);
  const e20 = ema(c,20);
  const { hist } = macd(c,12,26,9);
  const R = rsi(c,14);
  if (!e20.length || !hist.length || !R.length) return null;

  const last = rows.at(-1);
  const prev = rows.at(-2) || last;

  const upVsEma = last.c > e20.at(-1) ? 1 : 0;          // เหนือ EMA20 = โมเมนตัมบวก
  const macdMom = Math.max(0, hist.at(-1));            // ฮิสโตแกรม > 0
  const rsiUp   = Math.max(0, (R.at(-1) - 50) / 20);   // 50→70
  const volKick = Math.min((last.v||1)/(prev.v||1), 3) - 1; // เพิ่มวอลุ่ม

  const s = upVsEma*0.35 + macdMom*0.4 + rsiUp*0.2 + volKick*0.05;
  return { score: s, lastClose: last.c, rsi: R.at(-1), e20: e20.at(-1) };
}

/** ---------- โหมด 1–2 เดือน ---------- */
function scoreSwing(rows) {
  const c = rows.map(r=>r.c);
  const e20 = ema(c,20), e50 = ema(c,50), e200 = ema(c,200);
  const R = rsi(c,14);
  if (!e20.length || !e50.length || !R.length) return null;

  const last = rows.at(-1);

  const trendUp = (e20.at(-1) > e50.at(-1) ? 1 : 0) + (e50.at(-1) > (e200.at(-1) ?? e50.at(-1)) ? 1 : 0);
  const pullNear = e50.at(-1) ? Math.max(0, 1 - Math.abs(last.c - e50.at(-1))/e50.at(-1)) : 0;
  const rsiMid = Math.max(0, 1 - Math.abs((R.at(-1)-50)/20));

  const s = trendUp*0.5 + pullNear*0.3 + rsiMid*0.2;
  return { score: s, lastClose: last.c, rsi: R.at(-1), e20: e20.at(-1), e50: e50.at(-1), e200: e200.at(-1)??null };
}

/** ---------- โหมด 10–20 ปี (พื้นฐาน) ---------- */
function norm(x, a, b) { // normalize -> 0..1
  if (x==null || isNaN(x)) return 0;
  return Math.max(0, Math.min(1, (x - a) / Math.max(1e-9, b - a)));
}

function scoreLongFund(f) {
  // ปรับช่วง normalize ตามสไตล์คุณได้
  const growth   = (norm(f.revenueCAGR5, 0, 30) + norm(f.epsCAGR5, 0, 30)) / 2;         // การเติบโต
  const margins  = (norm(f.grossMargin, 20, 70) + norm(f.opMargin, 10, 40) + norm(f.fcfMargin, 5, 30)) / 3; // คุณภาพธุรกิจ
  const quality  = norm(f.roic, 5, 30);                                                 // ใช้ทุนเก่ง
  const balance  = 1 - norm(f.debtToEquity, 0.5, 2.0);                                  // หนี้ยิ่งต่ำยิ่งดี
  const value    = (1 - norm(f.pe, 10, 40)) * 0.6 + (1 - norm(f.ps, 2, 12)) * 0.4;      // มูลค่ายิ่งถูกยิ่งดี

  // น้ำหนักรวม
  const s = growth*0.35 + margins*0.2 + quality*0.2 + balance*0.15 + value*0.1;
  return Math.max(0, Math.min(1, s)); // 0..1
}

async function scoreLong(baseUrl, symbol) {
  const f = await getFund(baseUrl, symbol);
  if (!f) return null;
  const s = scoreLongFund(f);
  return {
    score: s,
    factors: {
      revenueCAGR5: f.revenueCAGR5, epsCAGR5: f.epsCAGR5,
      grossMargin: f.grossMargin, opMargin: f.opMargin, roic: f.roic,
      debtToEquity: f.debtToEquity, fcfMargin: f.fcfMargin, pe: f.pe, ps: f.ps
    }
  };
}

/** ---------- สร้างสัญญาณ Buy / Hold / Sell จากอินดี้ ---------- */
function aiSignalFromRows(rows){
  const c = rows.map(r=>r.c);
  const e20 = ema(c,20), e50 = ema(c,50);
  const { line, signal, hist } = macd(c,12,26,9);
  const R = rsi(c,14);
  if (!e20.length || !e50.length || !hist.length || !R.length) return { action:'Hold' };

  const last = rows.at(-1);
  let score = 0;
  if (last.c > e20.at(-1)) score += 1;
  if (e20.at(-1) > e50.at(-1)) score += 1;
  if (hist.at(-1) > 0) score += 1;
  if (line.at(-1) > signal.at(-1)) score += 1;
  if (R.at(-1) > 50) score += 1;

  if (score >= 4) return { action:'Buy', confidence: score/5 };
  if (score <= 1) return { action:'Sell', confidence: (2-score)/2 };
  return { action:'Hold', confidence: 0.5 };
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
        if (horizon === 'long') {
          const L = await scoreLong(base, s);
          if (L) out.push({ symbol: s, ...L });
        } else {
          const rows = await getRows(base, s, horizon==='short' ? '6mo' : '2y', '1d');
          if (!rows) continue;
          const m = horizon==='short' ? scoreShort(rows) : scoreSwing(rows);
          const sig = aiSignalFromRows(rows);
          if (m) out.push({ symbol: s, ...m, signal: sig?.action, conf: sig?.confidence });
        }
      } catch {}
    }

    const ranked = out
      .filter(x => typeof x.score === 'number')
      .sort((a,b) => (b.score??0) - (a.score??0))
      .slice(0, 100);

    res.status(200).json({ horizon, results: ranked });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'screener failed' });
  }
    }
