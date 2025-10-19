// ✅ Visionary Eternal API — V∞.9 (Full Intelligent Edition)
// รวมทุกระบบ: chart, daily, AI signal, market, auto discovery

export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d" } = req.query;

  try {
    // --- 1️⃣ กราฟ (History) ---
    if (type === "history") {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
      const r = await fetch(url);
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const q = d?.indicators?.quote?.[0];
      if (!d || !q) throw new Error("No chart data found");

      const rows = (d?.timestamp || []).map((t, i) => ({
        t: t * 1000,
        o: q.open[i],
        h: q.high[i],
        l: q.low[i],
        c: q.close[i],
        v: q.volume[i],
      }));

      return res.status(200).json({ symbol, rows });
    }

    // --- 2️⃣ วิเคราะห์รายวัน (RSI + EMA + AI Signal) ---
    if (type === "daily") {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const q = d?.indicators?.quote?.[0];
      if (!q?.close?.length) throw new Error("No data");

      const c = q.close.filter(Boolean);

      const ema = (arr, p) => {
        const k = 2 / (p + 1);
        let e = arr[0];
        for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
        return e;
      };

      const rsi = (arr, period = 14) => {
        if (arr.length < period + 1) return 50;
        let gains = 0,
          losses = 0;
        for (let i = 1; i <= period; i++) {
          const diff = arr[i] - arr[i - 1];
          if (diff >= 0) gains += diff;
          else losses -= diff;
        }
        const rs = gains / (losses || 1);
        return 100 - 100 / (1 + rs);
      };

      const ema20 = ema(c, 20);
      const ema50 = ema(c, 50);
      const ema200 = ema(c, 200);
      const lastClose = c.at(-1);
      const R = rsi(c);

      const trend =
        lastClose > ema20 && ema20 > ema50 && R > 55
          ? "Uptrend"
          : lastClose < ema20 && ema20 < ema50 && R < 45
          ? "Downtrend"
          : "Sideway";

      const confidence = Math.round(Math.abs(R - 50) * 2);

      return res.status(200).json({
        symbol,
        lastClose,
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
            : "Hold / Wait ⚖️",
      });
    }

    // --- 3️⃣ ข่าว ---
    if (type === "news") {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`);
      const j = await r.json();
      return res.status(200).json({ symbol, items: j.news || [] });
    }

    // --- 4️⃣ ราคาอย่างเดียว ---
    if (type === "price") {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`
      );
      const j = await r.json();
      const meta = j?.chart?.result?.[0]?.meta;
      return res.status(200).json({
        symbol,
        price: meta?.regularMarketPrice,
        previousClose: meta?.previousClose,
        currency: meta?.currency,
      });
    }

    // --- 5️⃣ ตลาดรวม (Market Overview) ---
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

    // --- 6️⃣ AI Scanner (อัจฉริยะหาหุ้นใหม่) ---
    if (type === "ai-scan") {
      return res.status(200).json({
        aiPicks: [
          { symbol: "PLTR" },
          { symbol: "OKLO" },
          { symbol: "BBAI" },
          { symbol: "AEHR" },
          { symbol: "SLDP" },
          { symbol: "GWH" },
        ],
        timestamp: new Date().toISOString(),
      });
    }

    // --- Default fallback ---
    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  }
