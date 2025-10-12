import { aiTrade } from '../../lib/aiTrade';
export default async function handler(req,res){
  try{
    const { symbol }=req.query; if(!symbol) return res.status(400).json({ error:'Missing symbol' });
    const base=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const [ind, fund, news] = await Promise.all([
      fetch(`${base}/api/indicators?symbol=${encodeURIComponent(symbol)}&range=6mo&interval=1d`).then(r=>r.json()),
      fetch(`${base}/api/fundamentals?symbol=${encodeURIComponent(symbol)}`).then(r=>r.json()),
      fetch(`${base}/api/news?symbol=${encodeURIComponent(symbol)}`).then(r=>r.json()),
    ]);
    const signal=await aiTrade({ symbol, indicators:ind, fundamentals:fund, news:news.items });
    res.status(200).json(signal);
  }catch(e){ res.status(500).json({ error:e.message||'ai-trade failed' }); }
}
