// ✅ Visionary Eternal API — AI Core (V∞.5)
// ครอบคลุมทุกระบบ: daily, history, news, market, price, logo

export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d" } = req.query;

  try {
    const symbolUpper = symbol.toUpperCase();
    const symbolLower = symbol.toLowerCase();

    // --- 1️⃣ ดึงประวัติราคา ---
    if (type === "history") {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
      const r = await fetch(url);
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const q = d?.indicators?.quote?.[0];
      const rows = (d?.timestamp || []).map((t, i) => ({
        t: t * 1000,
        o: q?.open?.[i],
        h: q?.high?.[i],
        l: q?.low?.[i],
        c: q?.close?.[i],
        v: q?.volume?.[i],
      }));
      return res.status(200).json({ symbol, rows });
    }

    // --- 2️⃣ ดึงข้อมูลรายวัน + สัญญาณ AI ---
    if (type === "daily") {
      const base = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
      const r = await fetch(base);
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

      const signal =
        lastClose > ema20 && ema20 > ema50 && R > 55
          ? "Uptrend"
          : lastClose < ema20 && ema20 < ema50 && R < 45
          ? "Downtrend"
          : "Sideway";

      return res.status(200).json({
        symbol: symbolUpper,
        lastClose,
        ema20,
        ema50,
        ema200,
        rsi: R,
        trend: signal,
        confidencePercent: Math.round(Math.abs(R - 50) * 2),
      });
    }

    // --- 3️⃣ ข่าวหุ้น ---
    if (type === "news") {
      const newsUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`;
      const r = await fetch(newsUrl);
      const j = await r.json();
      return res.status(200).json({ symbol, items: j.news || [] });
    }

    // --- 4️⃣ ราคาปัจจุบัน ---
    if (type === "price") {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`);
      const j = await r.json();
      const meta = j?.chart?.result?.[0]?.meta;
      return res.status(200).json({
        symbol,
        price: meta?.regularMarketPrice,
        previousClose: meta?.previousClose,
        currency: meta?.currency,
      });
    }

    // --- 5️⃣ กลุ่มตลาด ---
    if (type === "market") {
      return res.status(200).json({
        groups: {
          fast: [{ symbol: "NVDA" }, { symbol: "TSLA" }, { symbol: "AMD" }],
          emerging: [{ symbol: "SLDP" }, { symbol: "NRGV" }, { symbol: "BEEM" }],
          future: [{ symbol: "PLTR" }, { symbol: "GWH" }, { symbol: "LWLG" }],
          hidden: [{ symbol: "AEHR" }, { symbol: "ENVX" }, { symbol: "SES" }],
        },
      });
    }

    // --- 6️⃣ ดึงโลโก้ (free, fast, auto) ---
    if (type === "logo") {
      const companies = [
        `https://companieslogo.com/img/orig/${symbolUpper}_BIG.png`,
        `https://logo.clearbit.com/${symbolLower}.com`,
      ];
      for (const url of companies) {
        try {
          const head = await fetch(url, { method: "HEAD" });
          if (head.ok) return res.status(200).json({ symbol, logo: url });
        } catch {}
      }
      return res.status(200).json({
        symbol,
        logo: "https://cdn-icons-png.flaticon.com/512/2301/2301122.png",
      });
    }

    // --- fallback ---
    res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
                     }
