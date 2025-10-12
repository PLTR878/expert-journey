export default async function handler(req,res){
  try{
    const { symbol, range='6mo', interval='1d' } = req.query;
    if(!symbol) return res.status(400).json({ error:'Missing symbol' });
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const r=await fetch(url); const j=await r.json(); const result=j?.chart?.result?.[0];
    if(!result) return res.status(404).json({ error:'Symbol not found' });
    const ts=result.timestamp||[]; const q=result.indicators?.quote?.[0]||{};
    const rows=ts.map((t,i)=>({ t:t*1000,o:q.open?.[i],h:q.high?.[i],l:q.low?.[i],c:q.close?.[i],v:q.volume?.[i] })).filter(x=>x.c!=null);
    res.status(200).json({ symbol: result.meta?.symbol||symbol, rows });
  }catch(e){ res.status(500).json({ error:e.message||'history failed' }); }
}
