// ✅ OriginX Hybrid Batch v∞.61 — Fast + Real Price + Safe on Vercel
export default async function handler(req, res) {
  const { batch = "1" } = req.query;

  const BATCH_SIZE = 250;
  const listURLs = [
    "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
    "https://datahub.io/core/nyse-listings/r/nyse-listed.csv",
  ];

  const EMA = (arr, p) => {
    if (arr.length < p) return arr.at(-1);
    const k = 2 / (p + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };

  const RSI = (arr, n = 14) => {
    if (arr.length < n + 1) return 50;
    let g = 0, l = 0;
    for (let i = arr.length - n; i < arr.length; i++) {
      const d = arr[i] - arr[i - 1];
      if (d >= 0) g += d; else l -= d;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  const getYahoo = async (sym) => {
    try {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`
      );
      const j = await r.json();
      return j?.chart?.result?.[0] || null;
    } catch {
      return null;
    }
  };

  try {
    // === 1) รวม NASDAQ + NYSE
    let all = [];
    for (const url of listURLs) {
      const raw = await fetch(url).then((r) => r.text());
      const list = raw
        .split("\n")
        .map((x) => x.split(",")[0]?.trim())
        .filter((s) => /^[A-Z.]{1,5}$/.test(s));
      all.push(...list);
    }
    all = Array.from(new Set(all));

    const totalBatches = Math.ceil(all.length / BATCH_SIZE);
    const i = Math.min(Number(batch), totalBatches);
    const start = (i - 1) * BATCH_SIZE;
    const symbols = all.slice(start, start + BATCH_SIZE);

    // === 2) สแกน + คำนวณ
    const results = [];
    for (const s of symbols) {
      const d = await getYahoo(s);
      const q = d?.indicators?.quote?.[0];
      const c = q?.close?.filter((x) => typeof x === "number") || [];
      const v = q?.volume?.filter((x) => typeof x === "number") || [];
      if (c.length < 20) continue;

      const last = c.at(-1);
      const prev = c.at(-2) || last;
      const change = ((last - prev) / prev) * 100;

      const ema20 = EMA(c, 20);
      const ema50 = EMA(c, 50);
      const rsi = RSI(c, 14);
      const trend =
        last > ema20 && ema20 > ema50
          ? "Uptrend"
          : last < ema20 && ema20 < ema50
          ? "Downtrend"
          : "Sideway";

      // === AI Logic
      let aiScore = 50;
      aiScore += trend === "Uptrend" ? 15 : trend === "Downtrend" ? -15 : 0;
      aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
      aiScore += rsi < 40 ? 10 : rsi > 70 ? -10 : 0;
      aiScore = Math.max(0, Math.min(100, aiScore));

      let signal = "Hold";
      if (aiScore >= 70 && trend === "Uptrend") signal = "Buy";
      else if (aiScore <= 30 && trend === "Downtrend") signal = "Sell";

      // === Filter แบบเบา (ไม่ข้ามหุ้นดี)
      if (last < 0.5 || last > 200) continue;

      results.push({
        symbol: s,
        price: Number(last.toFixed(2)), // ✅ เพิ่มราคาแน่นอน
        rsi: Number(rsi.toFixed(1)),
        ema20: Number(ema20?.toFixed(2)),
        ema50: Number(ema50?.toFixed(2)),
        change: Number(change.toFixed(2)),
        trend,
        aiScore,
        signal,
      });

      // ป้องกัน rate limit
      await new Promise((r) => setTimeout(r, 80));
    }

    // === 3) ส่งผลลัพธ์
    res.status(200).json({
      success: true,
      message: `✅ Batch ${i}/${totalBatches} done.`,
      nextBatch: i < totalBatches ? i + 1 : null,
      totalSymbols: all.length,
      scanned: symbols.length,
      passed: results.length,
      results: results.sort((a, b) => b.aiScore - a.aiScore).slice(0, 120),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  }
