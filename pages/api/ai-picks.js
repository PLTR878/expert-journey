export const config = { runtime: "nodejs" };

export default async function handler(req,res){
  try{
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    const [shortS, mediumS, longS, news] = await Promise.all([
      fetch(`${base}/api/screener`, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"short"})}).then(r=>r.json()),
      fetch(`${base}/api/screener`, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"medium"})}).then(r=>r.json()),
      fetch(`${base}/api/screener`, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"long"})}).then(r=>r.json()).catch(()=>({results:[]})),
      fetch(`${base}/api/news-intelligence-free`).then(r=>r.json())
    ]);

    const newsBy = {};
    for (const n of news.results||[]) {
      if (!n.symbol) continue;
      const boost = (n.sentiment>0 ? 0.1*n.sentiment : 0) + Math.max(0, 0.1 - (n.freshnessMin||0)/720);
      newsBy[n.symbol] = Math.max(newsBy[n.symbol]||0, boost);
    }

    const by = {};
    for (const r of shortS.results||[]) by[r.symbol] = { ...by[r.symbol], short:r };
    for (const r of mediumS.results||[]) by[r.symbol] = { ...by[r.symbol], medium:r };
    for (const r of longS.results||[]) by[r.symbol] = { ...by[r.symbol], long:r };

    const picks = Object.entries(by).map(([symbol, obj])=>{
      const s = (obj.short?.score ?? 0);
      const m = (obj.medium?.score ?? 0);
      const l = (obj.long?.score ?? 0);
      const rsi = obj.short?.rsi ?? obj.medium?.rsi ?? 50;
      const baseScore = 0.45*s + 0.4*m + 0.15*l;
      const rsiAdj = (rsi > 70 ? -0.2 : rsi < 40 ? 0.1 : 0);
      const newsAdj = newsBy[symbol] || 0;
      const total = baseScore + rsiAdj + newsAdj;
      const lastClose = obj.short?.lastClose ?? obj.medium?.lastClose ?? obj.long?.lastClose ?? null;
      return {
        symbol, lastClose, rsi,
        signal: total>0.85 ? "Buy" : total>0.55 ? "Hold" : "Watch",
        score: Number(total.toFixed(3))
      }
    })
    .filter(x => x.score > 0.55)
    .sort((a,b)=>b.score-a.score)
    .slice(0,20);

    res.setHeader("Cache-Control","public, s-maxage=60");
    res.status(200).json({ results: picks });
  }catch(e){
    res.status(500).json({ error: e?.message || "ai-picks failed" });
  }
                 }
