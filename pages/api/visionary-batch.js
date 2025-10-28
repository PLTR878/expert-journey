// ✅ Visionary Batch Scanner — v∞.49 (Smart Price Filter 2–65 + Ultra Stable)
export default async function handler(req, res) {
  const { batch = "1" } = req.query;
  const BATCH_SIZE = 300; // ✅ ความเร็ว + เสถียร
  const listURLs = [
    "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
    "https://datahub.io/core/nyse-listings/r/nyse-listed.csv",
  ];

  // ===== Simple Indicators =====
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
      const d = arr[i] - arr[i - 1];
      if (d >= 0) g += d;
      else l -= d;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  // ===== Yahoo Fetch =====
  const getYahoo = async (sym) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      return j?.chart?.result?.[0] || null;
    } catch {
      return null;
    }
  };

  try {
    // ===== 1. รวม ticker ทั้งตลาด =====
    let all = [];
    for (const url of listURLs) {
      const raw = await fetch(url).then((r) => r.text());
      const tickers = raw
        .split("\n")
        .map((l) => l.split(",")[0])
        .filter((s) => /^[A-Z.]{1,5}$/.test(s));
      all.push(...tickers);
    }

    const totalBatches = Math.ceil(all.length / BATCH_SIZE);
    const i = Math.min(Number(batch), totalBatches);
    const start = (i - 1) * BATCH_SIZE;
    const symbols = all.slice(start, start + BATCH_SIZE);

    // ===== 2. สแกนแต่ละหุ้น =====
    const results = [];
    for (const s of symbols) {
      try {
        const d = await getYahoo(s);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        if (!closes?.length) continue;

        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const last = closes.at(-1);
        const prev = closes.at(-2);
        const rsi = RSI(closes);
        const change = ((last - prev) / prev) * 100;

        // ✅ ฟิลเตอร์ราคาหุ้นระหว่าง $2 ถึง $65 เท่านั้น
        if (last < 2 || last > 65) continue;

        const trend =
          last > ema20 && ema20 > ema50
            ? "Up"
            : last < ema20 && ema20 < ema50
            ? "Down"
            : "Side";

        // ===== AI Logic =====
        let aiScore = 50;
        aiScore += trend === "Up" ? 15 : trend === "Down" ? -15 : 0;
        aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
        aiScore += rsi < 40 ? 10 : rsi > 70 ? -10 : 0;

        aiScore = Math.max(0, Math.min(100, aiScore));

        let signal = "Hold";
        if (aiScore >= 75 && trend === "Up" && rsi < 70) signal = "Buy";
        else if (aiScore <= 30 && trend === "Down" && rsi > 60) signal = "Sell";

        results.push({
          symbol: s,
          last: last.toFixed(2),
          ema20: ema20.toFixed(2),
          ema50: ema50.toFixed(2),
          rsi: rsi.toFixed(1),
          trend,
          aiScore,
          signal,
        });
      } catch {}
      await new Promise((r) => setTimeout(r, 80)); // ✅ เร็ว + ปลอด block
    }

    // ===== 3. ส่งผล =====
    const done = i >= totalBatches;
    res.status(200).json({
      success: true,
      message: done
        ? "✅ Completed all batches!"
        : `✅ Finished Batch ${i}/${totalBatches}`,
      nextBatch: done ? null : i + 1,
      totalSymbols: all.length,
      scanned: symbols.length,
      results,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
