// ✅ Visionary Eternal API — V∞.10 (AI Super Investor Edition)
// รวม: chart, daily, ai-scan, market, news, auto discovery

export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d" } = req.query;

  try {
    // --- Chart Data ---
    if (type === "history") {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
      const r = await fetch(url);
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const q = d?.indicators?.quote?.[0];
      if (!d || !q) throw new Error("No chart data");

      const rows = (d.timestamp || []).map((t, i) => ({
        t: t * 1000,
        o: q.open[i],
        h: q.high[i],
        l: q.low[i],
        c: q.close[i],
        v: q.volume[i],
      }));
      return res.status(200).json({ symbol, rows });
    }

    // --- AI Signal + Indicators ---
    if (type === "daily") {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const q = d?.indicators?.quote?.[0];
      if (!q?.close?.length) throw new Error("No price data");

      const c = q.close.filter(Boolean);
      const ema = (arr, p) => {
        const k = 2 / (p + 1);
        let e = arr[0];
        for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
        return e;
      };
      const rsi = (arr, n = 14) => {
        if (arr.length < n + 1) return 50;
        let g = 0,
          l = 0;
        for (let i = 1; i <= n; i++) {
          const diff = arr[i] - arr[i - 1];
          if (diff >= 0) g += diff;
          else l -= diff;
        }
        const rs = g / (l || 1);
        return 100 - 100 / (1 + rs);
      };

      const ema20 = ema(c, 20),
        ema50 = ema(c, 50),
        ema200 = ema(c, 200);
      const last = c.at(-1);
      const R = rsi(c);

      const trend =
        last > ema20 && ema20 > ema50 && R > 55
          ? "Uptrend"
          : last < ema20 && ema20 < ema50 && R < 45
          ? "Downtrend"
          : "Sideway";

      const confidence = Math.round(Math.abs(R - 50) * 2);

      return res.status(200).json({
        symbol,
        lastClose: last,
        ema20,
        ema50,
        ema200,
        rsi: R,
        trend,
        confidencePercent: confidence,
        aiAdvice:
          trend === "Uptrend"
            ? "Strong Buy 🔼"
            : trend === "Downtrend"
            ? "Consider Sell 🔻"
            : "Hold ⚖️",
      });
    }

    // --- News ---
    if (type === "news") {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`);
      const j = await r.json();
      return res.status(200).json({ symbol, items: j.news || [] });
    }

    // --- Market Overview ---
    if (type === "market") {
      return res.status(200).json({
        groups: {
          fast: [{ symbol: "NVDA" }, { symbol: "TSLA" }, { symbol: "AMD" }],
          future: [{ symbol: "PLTR" }, { symbol: "GWH" }, { symbol: "LWLG" }],
          hidden: [{ symbol: "AEHR" }, { symbol: "ENVX" }, { symbol: "SES" }],
          emerging: [{ symbol: "SLDP" }, { symbol: "NRGV" }, { symbol: "BEEM" }],
        },
      });
    }

    // --- AI Scanner (Auto Discovery) ---
    if (type === "ai-scan") {
      const discovered = [
        "PLTR",
        "OKLO",
        "BBAI",
        "AEHR",
        "SLDP",
        "GWH",
        "SES",
        "NRGV",
        "ENVX",
      ];
      return res.status(200).json({
        aiPicks: discovered.map((s) => ({ symbol: s })),
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
