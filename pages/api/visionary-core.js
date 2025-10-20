// /pages/api/visionary-core.js
export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d" } = req.query;

  const yfChart = async (sym, r = range, i = interval) => {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${r}&interval=${i}`;
    const rj = await fetch(u);
    const j = await rj.json();
    return j?.chart?.result?.[0];
  };

  const yfQuoteSummary = async (sym) => {
    try {
      const u = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=price`;
      const r = await fetch(u);
      const j = await r.json();
      const p = j?.quoteSummary?.result?.[0]?.price || {};
      return { longName: p.longName || "", shortName: p.shortName || "", currency: p.currency || "USD" };
    } catch { return { longName: "", shortName: "", currency: "USD" }; }
  };

  const EMA = (arr, p) => { if (!arr?.length) return null; const k = 2/(p+1); let e=arr[0]; for (let i=1;i<arr.length;i++) e = arr[i]*k + e*(1-k); return e; };
  const RSI = (arr, n=14) => { if (!arr || arr.length<n+1) return 50; let g=0,l=0; for (let i=1;i<=n;i++){ const d=arr[i]-arr[i-1]; if(d>=0) g+=d; else l-=d; } const rs=g/(l||1); return 100-100/(1+rs); };

  try {
    if (type === "history") {
      const d = await yfChart(symbol, range, interval);
      const q = d?.indicators?.quote?.[0];
      if (!d || !q) throw new Error("No chart data");
      const rows = (d.timestamp || []).map((t,i)=>({t:t*1000,o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i],v:q.volume[i]}));
      return res.status(200).json({ symbol: symbol.toUpperCase(), rows });
    }

    if (type === "daily") {
      const d = await yfChart(symbol, "6mo", "1d");
      const q = d?.indicators?.quote?.[0];
      if (!q?.close?.length) throw new Error("No price data");
      const c = q.close.filter((x)=>typeof x==="number");
      const last = c.at(-1);
      const ema20 = EMA(c,20), ema50 = EMA(c,50), ema200 = EMA(c,200);
      const rsi = RSI(c);
      const trend = last>ema20&&ema20>ema50&&rsi>55 ? "Uptrend" : last<ema20&&ema20<ema50&&rsi<45 ? "Downtrend" : "Sideway";
      const conf = Math.round(Math.min(100, Math.abs(rsi-50)*2));
      const prof = await yfQuoteSummary(symbol);
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        companyName: prof.longName || prof.shortName || symbol.toUpperCase(),
        currency: prof.currency || "USD",
        lastClose: last, ema20, ema50, ema200, rsi, trend,
        confidencePercent: conf,
        aiAdvice: trend==="Uptrend" ? "Strong Buy 🔼" : trend==="Downtrend" ? "Consider Sell 🔻" : "Hold ⚖️",
      });
    }

    if (type === "ai-news") {
      try {
        const kw = symbol?.toUpperCase() || "AAPL";
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${kw}`;
        const r = await fetch(url); const d = await r.json();
        const items = (d.news||[]).slice(0,10);
        const news = items.map((n)=>({
          title:n.title||"", publisher:n.publisher||"", link:n.link||n.url||"", summary:n.summary||"",
          time: n.providerPublishTime ? new Date(n.providerPublishTime*1000).toISOString() : "",
        }));
        return res.status(200).json({ symbol: kw, total: news.length, news, updatedAt: new Date().toISOString() });
      } catch (e) { return res.status(500).json({ error:"Cannot fetch news", detail:e.message }); }
    }

    if (type === "profile") {
      const prof = await yfQuoteSummary(symbol);
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        companyName: prof.longName || prof.shortName || symbol.toUpperCase(),
        currency: prof.currency || "USD",
      });
    }

    if (type === "market") {
      return res.status(200).json({
        groups: {
          fast:[{symbol:"NVDA"},{symbol:"TSLA"},{symbol:"AMD"}],
          future:[{symbol:"PLTR"},{symbol:"GWH"},{symbol:"LWLG"}],
          hidden:[{symbol:"AEHR"},{symbol:"ENVX"},{symbol:"SES"}],
          emerging:[{symbol:"SLDP"},{symbol:"NRGV"},{symbol:"BEEM"}],
        },
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) { return res.status(500).json({ error: err.message || String(err) }); }
    }
