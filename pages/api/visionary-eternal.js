// ✅ Visionary Eternal API — V∞.11 (AI Super Investor, One-API-To-Rule-Them-All)
// Endpoints:
//  - type=history          : OHLCV (chart)
//  - type=daily            : EMA/RSI + AI trend/advice
//  - type=market           : กลุ่มตลาด ตั้งต้น
//  - type=ai-news          : ดึงข่าว + ให้คะแนน sentiment (lightweight heuristic)
//  - type=ai-discovery     : สแกนหุ้นต้นน้ำ = ราคา(Uptrend early) + ข่าวเป็นบวก
//  - type=ai-scan          : รายชื่อ Top Picks (เรียกใช้จาก ai-discovery ได้เลย)
//  - type=profile          : ชื่อบริษัท (longName / shortName)
//  - type=logo             : ส่งโลโก้ที่ “เสถียร” พร้อม fallback หลายชั้น

export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d" } = req.query;

  // ---------- helpers ----------
  const yfChart = async (sym, r, i) => {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${r}&interval=${i}`;
    const rj = await fetch(u);
    const j = await rj.json();
    const d = j?.chart?.result?.[0];
    return d;
  };

  const yfQuoteSummary = async (sym) => {
    // longName / shortName
    try {
      const u = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=price,assetProfile`;
      const r = await fetch(u);
      const j = await r.json();
      const price = j?.quoteSummary?.result?.[0]?.price;
      return {
        longName: price?.longName || "",
        shortName: price?.shortName || "",
        currency: price?.currency || "",
      };
    } catch {
      return { longName: "", shortName: "", currency: "" };
    }
  };

  const calcEMA = (arr, p) => {
    if (!arr?.length) return null;
    const k = 2 / (p + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };

  const calcRSI = (arr, n = 14) => {
    if (!arr || arr.length < n + 1) return 50;
    let g = 0, l = 0;
    for (let i = 1; i <= n; i++) {
      const diff = arr[i] - arr[i - 1];
      if (diff >= 0) g += diff;
      else l -= diff;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  const inferDomain = (sym) => {
    // ครอบคลุมตัวที่เจอบ่อย + fallback เดาโดเมน
    const map = {
      NVDA: "nvidia.com",
      AAPL: "apple.com",
      TSLA: "tesla.com",
      MSFT: "microsoft.com",
      AMZN: "amazon.com",
      META: "meta.com",
      GOOG: "google.com",
      GOOGL: "google.com",
      AMD: "amd.com",
      INTC: "intel.com",
      PLTR: "palantir.com",
      NVO: "novonordisk.com",
      COST: "costco.com",
      UNH: "uhc.com",
      BBAI: "bigbear.ai",
      GWH: "esstech.com",
      NRGV: "energyvault.com",
      SLDP: "solidpowerbattery.com",
      AEHR: "aehr.com",
      OKLO: "oklo.com",
      ENVX: "enovix.com",
      SES: "ses.ai",
      BEEM: "beamglow.com", // เดา—บางตัวไม่มีชัดเจน ให้ Clearbit ลองก่อน
    };
    return map[sym] || `${sym.toLowerCase()}.com`;
  };

  const bestLogo = (sym) => {
    const s = sym.toUpperCase();
    // 1) companieslogo (คุณภาพสูง, มีหลายตัว)
    const c1 = `https://companieslogo.com/img/orig/${s}_BIG.png`;
    // 2) Clearbit จากโดเมนเดา/แมป
    const c2 = `https://logo.clearbit.com/${inferDomain(s)}`;
    // 3) TradingView static (บางตัวใช้ได้)
    const c3 = `https://s3-symbol-logo.tradingview.com/${s.toLowerCase()}--big.svg`;
    // 4) วิกิ (generic fallback – ให้ฝั่ง UI ตัดสินใจซ่อนถ้าโหลดไม่ได้)
    const c4 = `https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg`;

    // ส่งกลับเป็นลิสต์ให้ UI ไล่ลองโหลดตามลำดับ (front จะ onError เปลี่ยน src)
    return [c1, c2, c3, c4];
  };

  const newsSentimentScore = async (sym) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
      const j = await r.json();
      const items = (j.news || []).slice(0, 8);
      let score = 0;
      for (const n of items) {
        const t = `${n.title || ""} ${(n.summary || "")}`.toLowerCase();
        if (/(partnership|contract|award|expan|ai|accelerat|record|beat|upgrade)/.test(t)) score += 2;
        if (/(lawsuit|fraud|downturn|cuts|layoff|downgrade|miss)/.test(t)) score -= 2;
      }
      return { items, score };
    } catch {
      return { items: [], score: 0 };
    }
  };

  const earlyUptrend = (closes) => {
    const ema20 = calcEMA(closes, 20);
    const ema50 = calcEMA(closes, 50);
    const last = closes.at(-1);
    const rsi = calcRSI(closes, 14);
    const isUp = last > ema20 && ema20 > ema50 && rsi > 55;
    return { ok: !!isUp, ema20, ema50, last, rsi };
  };

  try {
    // --- Chart Data ---
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
      return res.status(200).json({ symbol, rows });
    }

    // --- Daily (AI Signal + Indicators) ---
    if (type === "daily") {
      const d = await yfChart(symbol, "6mo", "1d");
      const q = d?.indicators?.quote?.[0];
      if (!q?.close?.length) throw new Error("No price data");

      const c = q.close.filter((x) => typeof x === "number");
      const ema20 = calcEMA(c, 20);
      const ema50 = calcEMA(c, 50);
      const ema200 = calcEMA(c, 200);
      const last = c.at(-1);
      const R = calcRSI(c);

      const trend =
        last > ema20 && ema20 > ema50 && R > 55
          ? "Uptrend"
          : last < ema20 && ema20 < ema50 && R < 45
          ? "Downtrend"
          : "Sideway";

      const confidence = Math.round(Math.min(100, Math.max(0, Math.abs(R - 50) * 2)));
      const prof = await yfQuoteSummary(symbol);

      return res.status(200).json({
        symbol,
        companyName: prof.longName || prof.shortName || symbol,
        currency: prof.currency || "USD",
        lastClose: last,
        ema20, ema50, ema200,
        rsi: R,
        trend,
        confidencePercent: confidence,
        aiAdvice:
          trend === "Uptrend" ? "Strong Buy 🔼"
          : trend === "Downtrend" ? "Consider Sell 🔻"
          : "Hold ⚖️",
      });
    }

    // --- Market Overview ---
    if (type === "market") {
      return res.status(200).json({
        groups: {
          fast:    [{ symbol: "NVDA" }, { symbol: "TSLA" }, { symbol: "AMD" }],
          future:  [{ symbol: "PLTR" }, { symbol: "GWH" }, { symbol: "LWLG" }],
          hidden:  [{ symbol: "AEHR" }, { symbol: "ENVX" }, { symbol: "SES" }],
          emerging:[{ symbol: "SLDP" }, { symbol: "NRGV" }, { symbol: "BEEM" }],
        },
        updatedAt: new Date().toISOString(),
      });
    }

    // --- AI News Sentiment (lightweight) ---
    if (type === "ai-news") {
      const { watch = "" } = req.query; // ถ้าอยากส่งเป็น CSV: ?watch=NVDA,PLTR,AEHR
      const universe = (watch ? watch.split(",") : ["NVDA","PLTR","SLDP","AEHR","OKLO","ENVX","NRGV","SES","GWH","BBAI"])
        .map(s => s.trim().toUpperCase()).slice(0, 20);
      const out = [];
      for (const sym of universe) {
        const { items, score } = await newsSentimentScore(sym);
        out.push({ symbol: sym, sentimentScore: score, newsCount: items.length });
      }
      return res.status(200).json({ aiNewsSentiment: out, updatedAt: new Date().toISOString() });
    }

    // --- AI Discovery (หุ้นต้นน้ำ: ราคาเริ่มเทรนด์ + ข่าวบวก) ---
    if (type === "ai-discovery") {
      const { universe } = req.query;
      const list = (universe
        ? universe.split(",")
        : ["PLTR","NVDA","SLDP","AEHR","GWH","NRGV","SES","OKLO","ENVX","BBAI","TSLA","AMD","AAPL","MSFT"])
        .map(s => s.trim().toUpperCase()).slice(0, 40);

      const picks = [];
      for (const sym of list) {
        try {
          const d = await yfChart(sym, "3mo", "1d");
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x) => typeof x === "number");
          if (!closes?.length) continue;

          const eu = earlyUptrend(closes);
          if (!eu.ok) continue;

          const { score } = await newsSentimentScore(sym);
          if (score <= 0) continue;

          picks.push({
            symbol: sym,
            lastClose: eu.last,
            rsi: Math.round(eu.rsi),
            sentiment: score,
            reason: "Positive news + EMA20>EMA50 + RSI>55 (early uptrend)",
          });
        } catch {}
      }

      picks.sort((a, b) => (b.sentiment + b.rsi) - (a.sentiment + a.rsi));
      return res.status(200).json({
        discovered: picks.slice(0, 8),
        timestamp: new Date().toISOString(),
      });
    }

    // --- AI Scan (Top Picks) ใช้ผลจาก ai-discovery แบบเร็ว ๆ ---
    if (type === "ai-scan") {
      const resp = await handler(
        { query: { type: "ai-discovery" } },
        { status: () => ({ json: (x) => x }) } // ช่วย reuse ฟังก์ชัน
      );
      // หมายเหตุ: บน Next.js เรียกซ้ำแบบนี้ง่ายสุด ถ้าอยากชัวร์ ให้แตก logic ออกเป็นฟังก์ชันแยก
      return res.status(200).json(resp || { aiPicks: [], timestamp: new Date().toISOString() });
    }

    // --- Company Profile (ชื่อบริษัท)
    if (type === "profile") {
      const prof = await yfQuoteSummary(symbol);
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        companyName: prof.longName || prof.shortName || symbol.toUpperCase(),
        currency: prof.currency || "USD",
      });
    }

    // --- Logo (ส่งลิสต์โลโก้ให้ front ลองทีละอัน)
    if (type === "logo") {
      const list = bestLogo(symbol);
      return res.status(200).json({ symbol: symbol.toUpperCase(), logos: list });
    }

    // --- Unknown ---
    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
    }
