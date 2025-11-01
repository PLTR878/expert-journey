// ✅ Visionary Batch Scanner — v∞.50 (Quantum Filter: Price $2–$65 + Vol + RSI + Trend + AI Score)
export default async function handler(req, res) {
  const { batch = "1" } = req.query;

  // ===== Batch/Universe =====
  const BATCH_SIZE = 300; // เร็ว+เสถียร
  const listURLs = [
    "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
    "https://datahub.io/core/nyse-listings/r/nyse-listed.csv",
  ];

  // ===== Indicators (เบา เร็ว) =====
  const EMA = (arr, p) => {
    if (!arr || arr.length < 2) return null;
    const k = 2 / (p + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };

  const RSI = (arr, n = 14) => {
    if (!arr || arr.length < n + 1) return 50;
    let g = 0, l = 0;
    for (let i = arr.length - n; i < arr.length; i++) {
      const d = arr[i] - arr[i - 1];
      if (d >= 0) g += d; else l -= d;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  // ===== Fetch from Yahoo (มี fail-safe) =====
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
    // ===== 1) รวม NASDAQ + NYSE =====
    let all = [];
    for (const url of listURLs) {
      const raw = await fetch(url).then((r) => r.text());
      const tickers = raw
        .split("\n")
        .map((l) => l.split(",")[0]?.trim())
        .filter((s) => /^[A-Z.]{1,5}$/.test(s));
      all.push(...tickers);
    }
    // ลบซ้ำ
    all = Array.from(new Set(all));

    const totalBatches = Math.ceil(all.length / BATCH_SIZE);
    const i = Math.min(Number(batch), totalBatches);
    const start = (i - 1) * BATCH_SIZE;
    const symbols = all.slice(start, start + BATCH_SIZE);

    // ===== 2) สแกน + Quantum Filter =====
    const results = [];
    for (const s of symbols) {
      try {
        const d = await getYahoo(s);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        const vols = q?.volume?.filter((x) => typeof x === "number");
        if (!closes?.length || !vols?.length) continue;

        const last = closes.at(-1);
        const prev = closes.at(-2) ?? last;
        const change = ((last - prev) / prev) * 100;

        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const rsi = RSI(closes, 14);

        const volNow = vols.at(-1);
        const avgVol10 = vols.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, vols.length));
        const volSpike = volNow > avgVol10 * 1.8;

        const trend =
          last > ema20 && ema20 > ema50 ? "Up" :
          last < ema20 && ema20 < ema50 ? "Down" : "Side";

        // ===== AI Score (น้ำหนักกับ momentum/vol) =====
        let aiScore = 50;
        aiScore += trend === "Up" ? 20 : trend === "Down" ? -20 : 0;
        aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
        aiScore += rsi < 40 ? 8 : rsi > 70 ? -12 : 0;
        aiScore += volSpike ? 10 : 0;
        aiScore = Math.max(0, Math.min(100, aiScore));

        // ===== QUANTUM FILTER =====
        // 1) ราคา $2–$65
        if (!(last >= 2 && last <= 65)) continue;
        // 2) วอลุ่มล่าสุด > 200k
        if (!Number.isFinite(volNow) || volNow < 200_000) continue;
        // 3) ไม่ Overbought จัด
        if (rsi >= 60) continue;
        // 4) แนวโน้มต้อง Up
        if (trend !== "Up") continue;
        // 5) AI ต้องมั่นใจจริง
        if (aiScore < 80) continue;

        results.push({
          symbol: s,
          last: Number(last.toFixed(2)),
          rsi: Number(rsi.toFixed(1)),
          ema20: Number(ema20?.toFixed(2)),
          ema50: Number(ema50?.toFixed(2)),
          vol: volNow,
          aiScore,
          trend,
          signal: "Buy",
          change: Number(change.toFixed(2)),
        });
      } catch {
        /* ignore single-symbol errors */
      }

      // หน่วงสั้น ป้องกัน rate limit (ปลอดภัยกับ Vercel)
      await new Promise((r) => setTimeout(r, 120));
    }

    // ===== 3) ส่งผลลัพธ์ =====
    const done = i >= totalBatches;
    res.status(200).json({
      success: true,
      message: done ? "✅ Completed all batches!" : `✅ Finished Batch ${i}/${totalBatches}`,
      nextBatch: done ? null : i + 1,
      totalSymbols: all.length,
      scanned: symbols.length,
      passedFilter: results.length,
      results: results
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 100), // จำกัด payload ต่อ batch ให้เบา
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
        }
