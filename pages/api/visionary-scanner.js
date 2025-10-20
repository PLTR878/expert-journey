// /pages/api/visionary-scanner.js
export default async function handler(req, res) {
  const { type = "scanner", batch = "1" } = req.query;

  const BATCH_SIZE = 300;
  const stockListPath = "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv";

  const yfChart = async (sym, r="3mo", i="1d") => {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${r}&interval=${i}`;
    const rj = await fetch(u); const j = await rj.json();
    return j?.chart?.result?.[0];
  };
  const EMA = (arr, p) => { if (!arr?.length) return null; const k=2/(p+1); let e=arr[0]; for(let i=1;i<arr.length;i++) e=arr[i]*k+e*(1-k); return e; };
  const RSI = (arr, n=14) => { if (!arr || arr.length<n+1) return 50; let g=0,l=0; for(let i=1;i<=n;i++){ const d=arr[i]-arr[i-1]; if(d>=0) g+=d; else l-=d; } const rs=g/(l||1); return 100-100/(1+rs); };
  const newsSentiment = async (sym) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
      const j = await r.json(); const items = (j.news||[]).slice(0,10);
      let score=0; for(const n of items){ const t=`${n.title||""} ${(n.summary||"")}`.toLowerCase();
        if (/(ai|contract|growth|record|upgrade|expand|beat|partnership|award|approval|launch)/.test(t)) score+=2;
        if (/(fraud|lawsuit|miss|cut|layoff|downgrade|probe|halt|decline|warning)/.test(t)) score-=2;
      }
      return score;
    } catch { return 0; }
  };

  try {
    if (type === "ai-batchscan") {
      const raw = await fetch(stockListPath).then((r)=>r.text());
      const allSymbols = raw.split("\n").map(l=>l.split(",")[0]).filter(s=>/^[A-Z.]+$/.test(s)).slice(0,7000);

      const totalBatches = Math.ceil(allSymbols.length / BATCH_SIZE);
      const batchIndex = Math.min(Number(batch), totalBatches);
      const start = (batchIndex - 1) * BATCH_SIZE;
      const symbols = allSymbols.slice(start, start + BATCH_SIZE);

      const results = [];
      for (const sym of symbols) {
        try {
          const d = await yfChart(sym,"3mo","1d");
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x)=>typeof x==="number");
          if (!closes?.length) continue;
          const ema20=EMA(closes,20), ema50=EMA(closes,50), last=closes.at(-1), rsi=RSI(closes);
          if (last > 35 || rsi < 55 || ema20 <= ema50) continue;
          const sentiment = await newsSentiment(sym);
          if (sentiment <= 0) continue;
          const aiScore = (rsi-50)*2 + sentiment*10;
          results.push({ symbol: sym, price: Number(last.toFixed(2)), rsi: Math.round(rsi), sentiment, aiScore });
        } catch {}
      }

      const done = batchIndex === totalBatches;
      return res.status(200).json({
        message: done ? "✅ สแกนครบทุกตัวแล้ว!" : `✅ สแกน Batch ${batchIndex}/${totalBatches} เสร็จแล้ว`,
        analyzed: symbols.length, found: results.length,
        nextBatch: done ? null : batchIndex + 1,
        top: results.sort((a,b)=>b.aiScore-a.aiScore).slice(0,10),
      });
    }

    if (type === "scanner") {
      const watch = ["AAPL","TSLA","NVDA","PLTR","GWH","NRGV","SLDP","BBAI","OKLO","AMD","MSFT"];
      const results=[];
      for (const sym of watch) {
        try{
          const d = await yfChart(sym,"3mo","1d");
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x)=>typeof x==="number");
          if (!closes?.length) continue;
          const ema20=EMA(closes,20), ema50=EMA(closes,50), last=closes.at(-1), rsi=RSI(closes);
          const trend = last>ema20&&ema20>ema50&&rsi>55 ? "Uptrend" : last<ema20&&ema20<ema50&&rsi<45 ? "Downtrend" : "Sideway";
          results.push({ symbol:sym, lastClose:Number(last.toFixed(2)), rsi:Math.round(rsi), trend,
            reason:"AI-scan detected potential move",
            signal: trend==="Uptrend" ? "Buy" : trend==="Downtrend" ? "Sell" : "Hold",
          });
        }catch{}
      }
      return res.status(200).json({ scanned: results.length, stocks: results, updatedAt: new Date().toISOString() });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) { return res.status(500).json({ error: err.message || String(err) }); }
}
