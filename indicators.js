import { ema, rsi, macd, atr } from '../../lib/indicators';
export default async function handler(req,res){
  try{
    const { symbol, range='6mo', interval='1d' } = req.query; if(!symbol) return res.status(400).json({ error:'Missing symbol' });
    const base=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const hist=await fetch(`${base}/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`).then(r=>r.json());
    const rows=hist?.rows||[]; if(!rows.length) return res.status(404).json({ error:'No data' });
    const c=rows.map(r=>r.c), h=rows.map(r=>r.h), l=rows.map(r=>r.l), v=rows.map(r=>r.v);
    const E20=ema(c,20), E50=ema(c,50), E200=ema(c,200); const R=rsi(c,14); const M=macd(c,12,26,9); const A=atr(h,l,c,14);
    res.status(200).json({ symbol, lastClose:c.at(-1), ema20:E20.at(-1)??null, ema50:E50.at(-1)??null, ema200:E200.at(-1)??null, rsi14:R.at(-1)??null, macd:{ line:M.macd.at(-1)??null, signal:M.signal.at(-1)??null, hist:M.hist.at(-1)??null }, atr14:A.at(-1)??null, volume:v.at(-1)??null, rows });
  }catch(e){ res.status(500).json({ error:e.message||'indicators failed' }); }
}
