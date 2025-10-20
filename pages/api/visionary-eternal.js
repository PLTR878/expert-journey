// ✅ Visionary Eternal API — V∞.17 (Discovery + Full Market Batchscan)
export default async function handler(req, res) {
  const { type = "ai-discovery", batch = "1" } = req.query;

  const BATCH_SIZE = 300;
  const stockListPath = "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv";

  const yfChart = async (sym, range = "3mo", interval = "1d") => {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${range}&interval=${interval}`);
    const j = await r.json();
    return j?.chart?.result?.[0];
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
      if (diff >= 0) g += diff; else l -= diff;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  const newsSentiment = async (sym) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
      const j = await r.json();
      const items = (j.news || []).slice(0, 6);
      let score = 0;
      for (const n of items) {
        const t = `${n.title || ""} ${(n.summary || "")}`.toLowerCase();
        if (/(ai|contract|growth|record|upgrade|expand|beat|partnership)/.test(t)) score += 2;
        if (/(fraud|lawsuit|miss|cut|layoff|downgrade)/.test(t)) score -= 2;
      }
      return score;
    } catch {
      return 0;
    }
  };

  // ✅ แบบเร็ว (หุ้นต้นน้ำ 10 ตัวแรก)
  if (type === "ai-discovery") {
    const universe = [
      "PLTR", "NVDA", "AMD", "TSLA", "GWH", "SLDP", "AEHR", "OKLO", "NRGV", "BBAI", "SOFI", "IREN", "INTC", "BTDR", "LAES"
    ];

    const picks = [];
    for (const sym of universe) {
      try {
        const d = await yfChart(sym);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        if (!closes?.length) continue;
        const ema20 = calcEMA(closes, 20);
        const ema50 = calcEMA(closes, 50);
        const last = closes.at(-1);
        const rsi = calcRSI(closes);
        const sentiment = await newsSentiment(sym);
        const up = last > ema20 && ema20 > ema50 && rsi > 55 && last <= 35 && sentiment > 0;
        if (up) {
          const score = (rsi - 50) * 2 + sentiment * 10;
          picks.push({ symbol: sym, price: last.toFixed(2), rsi, sentiment, score });
        }
      } catch {}
    }

    picks.sort((a, b) => b.score - a.score);
    return res.status(200).json({
      discovered: picks,
      updatedAt: new Date().toISOString(),
    });
  }

  // ✅ แบบสแกนทั้งตลาด 7000 ตัว (แบ่งรอบละ 300)
  if (type === "ai-batchscan") {
    try {
      const raw = await fetch(stockListPath).then(r => r.text());
      const allSymbols = raw
        .split("\n")
        .map(l => l.split(",")[0])
        .filter(s => /^[A-Z.]+$/.test(s))
        .slice(0, 7000);

      const totalBatches = Math.ceil(allSymbols.length / BATCH_SIZE);
      const batchIndex = Math.min(Number(batch), totalBatches);

      const start = (batchIndex - 1) * BATCH_SIZE;
      const symbols = allSymbols.slice(start, start + BATCH_SIZE);

      const results = [];
      for (const sym of symbols) {
        try {
          const d = await yfChart(sym);
          const q = d?.indicators?.quote?.[0];
          const closes = q?.close?.filter((x) => typeof x === "number");
          if (!closes?.length) continue;
          const ema20 = calcEMA(closes, 20);
          const ema50 = calcEMA(closes, 50);
          const last = closes.at(-1);
          const rsi = calcRSI(closes);
          if (last > 35 || rsi < 55 || ema20 <= ema50) continue;
          const sentiment = await newsSentiment(sym);
          if (sentiment <= 0) continue;
          const aiScore = (rsi - 50) * 2 + sentiment * 10;
          results.push({ symbol: sym, price: Number(last.toFixed(2)), rsi, sentiment, aiScore });
        } catch {}
      }

      const completed = batchIndex === totalBatches;
      return res.status(200).json({
        message: completed
          ? "✅ สแกนครบทุกตัวแล้ว!"
          : `✅ สแกน Batch ${batchIndex}/${totalBatches} เสร็จแล้ว`,
        analyzed: symbols.length,
        found: results.length,
        nextBatch: completed ? null : batchIndex + 1,
        top: results.slice(0, 10),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: "Unknown type" });
    }
