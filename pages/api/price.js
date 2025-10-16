// ✅ /pages/api/price.js — ราคา + RSI + สัญญาณพื้นฐาน
export default async function handler(req, res) {
  try {
    const symbol = String(req.query.symbol || "").toUpperCase();
    if (!symbol) return res.status(400).json({ error: "symbol required" });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("fetch failed");
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const price = result?.meta?.regularMarketPrice ?? closes.at(-1) ?? null;

    // rsi
    const computeRSI14 = (cl) => {
      const n = 14; if (!cl || cl.length < n + 1) return null;
      let g=0,l=0; for (let i=1;i<=n;i++){const d=cl[i]-cl[i-1]; if(d>=0)g+=d; else l-=d;}
      let ag=g/n, al=l/n;
      for (let i=n+1;i<cl.length;i++){const d=cl[i]-cl[i-1]; const G=d>0?d:0, L=d<0?-d:0; ag=(ag*(n-1)+G)/n; al=(al*(n-1)+L)/n;}
      if (al===0) return 100; const rs=ag/al; return 100-100/(1+rs);
    };
    const rsi = computeRSI14(closes);
    const signal = rsi==null ? "Neutral" : rsi>=55 ? "Buy" : rsi<=45 ? "Sell" : "Neutral";

    return res.json({ symbol, price, rsi, signal });
  } catch (e) {
    res.status(200).json({ error: e.message });
  }
                          }
