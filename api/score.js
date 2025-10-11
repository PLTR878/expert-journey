export const config = { runtime: "nodejs" };

function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  let g=0,l=0;
  for(let i=1;i<=period;i++){ const d=values[i]-values[i-1]; if(d>=0) g+=d; else l-=d; }
  let ag=g/period, al=l/period;
  for(let i=period+1;i<values.length;i++){
    const d=values[i]-values[i-1];
    ag=(ag*(period-1)+Math.max(0,d))/period;
    al=(al*(period-1)+Math.max(0,-d))/period;
  }
  if(al===0) return 100;
  const rs=ag/al; return Math.round(100-100/(1+rs));
}

export default async function handler(req, res) {
  try {
    const symbol = (req.query.symbol || "PLTR").toUpperCase();
    const base = `https://${req.headers.host}`;

    // ----- quote ผ่าน proxy ภายใน -----
    const qd = await fetch(`${base}/api/proxy?kind=quote&symbol=${encodeURIComponent(symbol)}`).then(r=>r.json());
    const quote = qd?.quoteResponse?.result?.[0];
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    // ----- candles ผ่าน proxy ภายใน -----
    const cd = await fetch(`${base}/api/proxy?kind=chart&symbol=${encodeURIComponent(symbol)}&range=6mo&interval=1d`).then(r=>r.json());
    const closes = cd?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    const clean = closes.filter(v => typeof v === "number");

    const rsi14 = clean.length ? rsi(clean, 14) : null;

    let trend = "Neutral", score = 70;
    if (clean.length >= 20) {
      const last = clean.at(-1);
      const ma20 = clean.slice(-20).reduce((a,b)=>a+b,0)/20;
      const slope = last - clean.at(-20);
      if (last > ma20 && slope > 0) { trend="Up"; score += 15; }
      if (last < ma20 && slope < 0) { trend="Down"; score -= 15; }
    }
    if (rsi14 != null) {
      if (rsi14 > 70) score -= 10;
      else if (rsi14 < 30) score += 10;
    }
    score = Math.max(0, Math.min(100, score));

    res.status(200).json({
      symbol,
      price: quote.regularMarketPrice ?? null,
      change: quote.regularMarketChangePercent ?? null,
      rsi14, trend, score
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
