export default async function handler(req,res){
  try{
    const { symbol='AAPL' } = req.query; const f=process.env.FINNHUB_KEY;
    if(f){
      const r=await fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=2024-01-01&to=2030-01-01&token=${f}`); const j=await r.json();
      return res.status(200).json({ source:'finnhub', items:(j||[]).slice(-20).reverse().map(x=>({ title:x.headline, url:x.url, datetime:(x.datetime||0)*1000, source:x.source })) });
    }
    const rss=await fetch(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`).then(r=>r.text());
    const items=Array.from(rss.matchAll(/<item>([\s\S]*?)<\/item>/g)).map(m=>{ const b=m[1]; const t=(b.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)||[])[1]||(b.match(/<title>(.*?)<\/title>/)||[])[1]||'News'; const link=(b.match(/<link>(.*?)<\/link>/)||[])[1]||'#'; const pub=(b.match(/<pubDate>(.*?)<\/pubDate>/)||[])[1]||null; return { title:t, url:link, datetime: pub? Date.parse(pub): Date.now(), source:'Yahoo' }; }).slice(0,20);
    res.status(200).json({ source:'yahoo_rss', items });
  }catch(e){ res.status(500).json({ error:e.message||'news failed' }); }
}
