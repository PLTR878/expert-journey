export default async function handler(req,res){
  try{
    const { symbol }=req.query; if(!symbol) return res.status(400).json({ error:'Missing symbol' });
    const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`); const j=await r.json();
    const result=j?.chart?.result?.[0]; if(!result) return res.status(404).json({ error:'Symbol not found' });
    const meta=result.meta||{}; const price=meta.regularMarketPrice ?? meta.previousClose ?? null; const changePct=meta.regularMarketChangePercent ?? 0;
    res.status(200).json({ symbol: meta.symbol||symbol, price, changePct, currency: meta.currency||'USD', ts: Date.now() });
  }catch(e){ res.status(500).json({ error:e.message||'quote failed' }); }
}
