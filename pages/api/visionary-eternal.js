// ✅ Visionary Eternal API — V∞.12 (AI Super Investor Enhanced)
// Features:
//  - AI Discovery เฉพาะหุ้นราคาต่ำกว่า $35
//  - ครอบคลุมหลายอุตสาหกรรม (Tech, Fintech, Energy, Data, Bank, AI)
//  - รองรับ universe เพิ่มได้ไม่จำกัด

export default async function handler(req, res) {
  const { type = "daily", symbol = "AAPL", range = "6mo", interval = "1d", universe } = req.query;

  // ---------- Helper ----------
  const yfChart = async (sym, r, i) => {
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

  const newsSentimentScore = async (sym) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
      const j = await r.json();
      const items = (j.news || []).slice(0, 6);
      let score = 0;
      for (const n of items) {
        const t = `${n.title || ""} ${(n.summary || "")}`.toLowerCase();
        if (/(partnership|contract|award|expan|ai|record|beat|upgrade)/.test(t)) score += 2;
        if (/(lawsuit|fraud|cuts|downgrade|miss|decline|layoff)/.test(t)) score -= 2;
      }
      return { score };
    } catch {
      return { score: 0 };
    }
  };

  const earlyUptrend = (closes) => {
    const ema20 = calcEMA(closes, 20);
    const ema50 = calcEMA(closes, 50);
    const last = closes.at(-1);
    const rsi = calcRSI(closes, 14);
    const isUp = last > ema20 && ema20 > ema50 && rsi > 55;
    return { ok: !!isUp, last, rsi, ema20, ema50 };
  };

  try {
    // --- AI Discovery (หุ้นต้นน้ำราคาถูก) ---
    if (type === "ai-discovery") {
      // ✅ Universe หลายกลุ่ม
      const allUniverse = (universe
        ? universe.split(",")
        : [
            // Tech & AI
            "PLTR", "BBAI", "AEHR", "SLDP", "NRGV", "GWH", "ENVX", "OKLO", "AMD", "INTC",
            // Fintech & Bank
            "SOFI", "AFRM", "UPST", "HOOD",
            // Energy / Power
            "IREN", "BTDR", "QS", "BEEM", "SES",
            // Materials / Bio / Future
            "LAES", "LWLG", "TMBR", "DNA",
          ]
      )
        .map((s) => s.trim().toUpperCase())
        .slice(0, 80); // รองรับได้เยอะ

      const picks = [];

      for (const sym of allUniverse) {
        try {
          const d = await yfChart(sym, "3mo", "1d");
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x) => typeof x === "number");
          if (!closes?.length) continue;

          const eu = earlyUptrend(closes);
          const price = eu.last;
          if (!eu.ok || price > 35 || price <= 0) continue; // ✅ กรองราคาไม่เกิน 35 USD

          const { score } = await newsSentimentScore(sym);
          if (score <= 0) continue; // ✅ ข่าวต้องเป็นบวก

          picks.push({
            symbol: sym,
            lastClose: price,
            rsi: Math.round(eu.rsi),
            sentiment: score,
            reason: "Positive news + EMA20>EMA50 + RSI>55 (early uptrend)",
          });
        } catch (err) {
          console.log("Skip", sym, err.message);
        }
      }

      picks.sort((a, b) => (b.sentiment + b.rsi) - (a.sentiment + a.rsi));

      return res.status(200).json({
        discovered: picks,
        count: picks.length,
        timestamp: new Date().toISOString(),
      });
    }

    // --- Daily (สำหรับหน้า chart เดี่ยว) ---
    if (type === "daily") {
      const d = await yfChart(symbol, range, interval);
      const q = d?.indicators?.quote?.[0];
      const c = q?.close?.filter((x) => typeof x === "number");
      if (!c?.length) throw new Error("No price data");

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
      const prof = await yfQuoteSummary(symbol);

      return res.status(200).json({
        symbol,
        companyName: prof.longName || prof.shortName || symbol,
        lastClose: last,
        ema20,
        ema50,
        ema200,
        rsi: R,
        trend,
        aiAdvice:
          trend === "Uptrend" ? "Strong Buy 🔼" :
          trend === "Downtrend" ? "Consider Sell 🔻" : "Hold ⚖️",
      });
    }

    // --- Unknown ---
    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
            }
