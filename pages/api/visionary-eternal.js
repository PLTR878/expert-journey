// ✅ Visionary Eternal API — V∞.18 (Full: daily/history + discovery + batchscan)
export default async function handler(req, res) {
  const {
    type = "daily",
    symbol = "AAPL",
    range = "6mo",
    interval = "1d",
    batch = "1",
  } = req.query;

  // ---------- helpers ----------
  const BATCH_SIZE = 300;
  const stockListPath =
    "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv";

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

  const newsSentiment = async (sym) => {
    try {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`
      );
      const j = await r.json();
      const items = (j.news || []).slice(0, 6);
      let score = 0;
      for (const n of items) {
        const t = `${n.title || ""} ${(n.summary || "")}`.toLowerCase();
        if (
          /(ai|contract|growth|record|upgrade|expand|beat|partnership|award|accelerat)/.test(
            t
          )
        )
          score += 2;
        if (/(fraud|lawsuit|miss|cut|layoff|downgrade|probe|halt)/.test(t))
          score -= 2;
      }
      return { items, score };
    } catch {
      return { items: [], score: 0 };
    }
  };

  // ---------- endpoints ----------
  try {
    // --- 1) OHLCV history ---
    if (type === "history") {
      const d = await yfChart(symbol, range, interval);
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
      return res.status(200).json({ symbol: symbol.toUpperCase(), rows });
    }

    // --- 2) Daily indicators + AI advice  (← ฝั่ง UI ใช้อันนี้) ---
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
        ema20,
        ema50,
        ema200,
        rsi,
        trend,
        confidencePercent: conf,
        aiAdvice:
          trend === "Uptrend"
            ? "Strong Buy 🔼"
            : trend === "Downtrend"
            ? "Consider Sell 🔻"
            : "Hold ⚖️",
      });
    }

    // --- 3) Short market groups (ไว้ใช้หน้าเดิมที่มีปุ่มแท็บ) ---
    if (type === "market") {
      return res.status(200).json({
        groups: {
          fast: [{ symbol: "NVDA" }, { symbol: "TSLA" }, { symbol: "AMD" }],
          future: [{ symbol: "PLTR" }, { symbol: "GWH" }, { symbol: "LWLG" }],
          hidden: [{ symbol: "AEHR" }, { symbol: "ENVX" }, { symbol: "SES" }],
          emerging: [{ symbol: "SLDP" }, { symbol: "NRGV" }, { symbol: "BEEM" }],
        },
        updatedAt: new Date().toISOString(),
      });
    }

    // --- 4) AI discovery (ราคาต่ำกว่า $35 + early uptrend + ข่าวบวก) ---
    if (type === "ai-discovery") {
      const universe = [
        // กลุ่มธนาคาร/ฟินเทค + พลังงาน/เหมือง + AI/ชิ้นส่วน
        "SOFI",
        "ALLY",
        "FUTU",
        "PLTR",
        "BBAI",
        "OKLO",
        "SLDP",
        "NRGV",
        "GWH",
        "ENVX",
        "SES",
        "IREN",
        "BTDR",
        "RIOT",
        "MARA",
        "LAES",
        "INTC", // (เกิน 35 บางวันกรองออก)
        "AMD",
        "NVDA",
        "TSLA",
      ];

      const picks = [];
      for (const sym of universe) {
        try {
          const d = await yfChart(sym, "3mo", "1d");
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x) => typeof x === "number");
          if (!closes?.length) continue;

          const ema20 = EMA(closes, 20);
          const ema50 = EMA(closes, 50);
          const last = closes.at(-1);
          const rsi = RSI(closes);

          // เงื่อนไขหุ้นต้นน้ำ + ราคา <= 35 USD
          const { score } = await newsSentiment(sym);
          const isPick =
            last <= 35 && rsi > 55 && ema20 > ema50 && score > 0;

          if (!isPick) continue;

          const trend = "Uptrend";
          const reason =
            "AI-detected potential growth (price<=35, EMA20>EMA50, RSI>55, positive news)";
          const scoreRank = (rsi - 50) * 2 + score * 10;

          picks.push({
            symbol: sym,
            lastClose: Number(last.toFixed(2)),
            rsi: Math.round(rsi),
            trend,
            reason,
            sentiment: score,
            rank: scoreRank,
          });
        } catch {}
      }

      picks.sort((a, b) => b.rank - a.rank);
      return res
        .status(200)
        .json({ discovered: picks, timestamp: new Date().toISOString() });
    }

    // --- 5) Full market batch scan 7k (แบ่งรอบละ 300) ---
    if (type === "ai-batchscan") {
      const raw = await fetch(stockListPath).then((r) => r.text());
      const allSymbols = raw
        .split("\n")
        .map((l) => l.split(",")[0])
        .filter((s) => /^[A-Z.]+$/.test(s))
        .slice(0, 7000);

      const totalBatches = Math.ceil(allSymbols.length / BATCH_SIZE);
      const batchIndex = Math.min(Number(batch), totalBatches);

      const start = (batchIndex - 1) * BATCH_SIZE;
      const symbols = allSymbols.slice(start, start + BATCH_SIZE);

      const results = [];
      for (const sym of symbols) {
        try {
          const d = await yfChart(sym, "3mo", "1d");
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x) => typeof x === "number");
          if (!closes?.length) continue;

          const ema20 = EMA(closes, 20);
          const ema50 = EMA(closes, 50);
          const last = closes.at(-1);
          const rsi = RSI(closes);
          if (last > 35 || rsi < 55 || ema20 <= ema50) continue;

          const { score } = await newsSentiment(sym);
          if (score <= 0) continue;

          const aiScore = (rsi - 50) * 2 + score * 10;
          results.push({
            symbol: sym,
            price: Number(last.toFixed(2)),
            rsi: Math.round(rsi),
            sentiment: score,
            aiScore,
          });
        } catch {}
      }

      const done = batchIndex === totalBatches;
      return res.status(200).json({
        message: done
          ? "✅ สแกนครบทุกตัวแล้ว!"
          : `✅ สแกน Batch ${batchIndex}/${totalBatches} เสร็จแล้ว`,
        analyzed: symbols.length,
        found: results.length,
        nextBatch: done ? null : batchIndex + 1,
        top: results.sort((a, b) => b.aiScore - a.aiScore).slice(0, 10),
      });
    }

    // --- 6) Profile (name/currency) ---
    if (type === "profile") {
      const prof = await yfQuoteSummary(symbol);
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        companyName: prof.longName || prof.shortName || symbol.toUpperCase(),
        currency: prof.currency || "USD",
      });
    }

    // --- 7) Logo list (front จะลองโหลดทีละอัน) ---
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
