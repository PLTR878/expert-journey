// ✅ Visionary Core API — V∞.21L (Light Core Functions)
export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d" } = req.query;

  const yfChart = async (sym, r = range, i = interval) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${r}&interval=${i}`;
    const resp = await fetch(url);
    const json = await resp.json();
    return json?.chart?.result?.[0];
  };

  const yfQuoteSummary = async (sym) => {
    try {
      const u = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=price`;
      const r = await fetch(u);
      const j = await r.json();
      const price = j?.quoteSummary?.result?.[0]?.price;
      return {
        longName: price?.longName || "",
        shortName: price?.shortName || "",
        currency: price?.currency || "USD",
      };
    } catch {
      return { longName: "", shortName: "", currency: "USD" };
    }
  };

  const EMA = (arr, p) => {
    if (!arr?.length) return null;
    const k = 2 / (p + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };

  const RSI = (arr, n = 14) => {
    if (!arr || arr.length < n + 1) return 50;
    let g = 0, l = 0;
    for (let i = 1; i <= n; i++) {
      const diff = arr[i] - arr[i - 1];
      if (diff >= 0) g += diff; else l -= diff;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  try {
    // 📊 1. HISTORY
    if (type === "history") {
      const d = await yfChart(symbol, range, interval);
      const q = d?.indicators?.quote?.[0];
      if (!d || !q) throw new Error("No chart data");
      const rows = (d.timestamp || []).map((t, i) => ({
        t: t * 1000, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i],
      }));
      return res.status(200).json({ symbol: symbol.toUpperCase(), rows });
    }

    // 📈 2. DAILY
    if (type === "daily") {
      const d = await yfChart(symbol, "6mo", "1d");
      const q = d?.indicators?.quote?.[0];
      if (!q?.close?.length) throw new Error("No price data");

      const c = q.close.filter((x) => typeof x === "number");
      const ema20 = EMA(c, 20);
      const ema50 = EMA(c, 50);
      const ema200 = EMA(c, 200);
      const last = c.at(-1);
      const rsi = RSI(c);

      const trend =
        last > ema20 && ema20 > ema50 && rsi > 55
          ? "Uptrend"
          : last < ema20 && ema20 < ema50 && rsi < 45
          ? "Downtrend"
          : "Sideway";

      const conf = Math.round(Math.min(100, Math.abs(rsi - 50) * 2));
      const prof = await yfQuoteSummary(symbol);

      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        companyName: prof.longName || prof.shortName || symbol.toUpperCase(),
        currency: prof.currency || "USD",
        lastClose: last,
        ema20, ema50, ema200,
        rsi,
        trend,
        confidencePercent: conf,
        aiAdvice: trend === "Uptrend" ? "Strong Buy 🔼" :
                  trend === "Downtrend" ? "Consider Sell 🔻" : "Hold ⚖️",
      });
    }

    // 🗞️ 3. AI NEWS
    if (type === "ai-news") {
      const keyword = symbol.toUpperCase();
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${keyword}`;
      const r = await fetch(url);
      const j = await r.json();
      const items = (j.news || []).slice(0, 10);
      const news = items.map((n) => ({
        title: n.title || "",
        publisher: n.publisher || "",
        link: n.link || n.url || "",
        summary: n.summary || "",
      }));
      return res.status(200).json({ symbol: keyword, news });
    }

    // 🧠 4. PROFILE + LOGO
    if (type === "profile") {
      const prof = await yfQuoteSummary(symbol);
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        companyName: prof.longName || prof.shortName || symbol.toUpperCase(),
        currency: prof.currency || "USD",
      });
    }

    if (type === "logo") {
      const s = symbol.toUpperCase();
      return res.status(200).json({
        symbol: s,
        logos: [
          `https://companieslogo.com/img/orig/${s}_BIG.png`,
          `https://logo.clearbit.com/${s.toLowerCase()}.com`,
          `https://s3-symbol-logo.tradingview.com/${s.toLowerCase()}--big.svg`,
        ],
      });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
  }
