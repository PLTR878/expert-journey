// ✅ /pages/api/visionary-core.js — Visionary Core API (Stable V∞.Final)
// ดึงราคาจริงจาก Yahoo Finance + คำนวณ RSI + EMA + Trend แบบแม่นยำ
// ใช้งานร่วมกับ visionary-scanner.js ได้ทันที

export default async function handler(req, res) {
  const { symbol, type = "daily" } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    // ✅ ดึงข้อมูลราคาจาก Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result) {
      // 🧩 fallback: ถ้าไม่มีข้อมูลจริง
      return res.status(200).json({
        symbol,
        lastClose: 0,
        rsi: 50,
        trend: "Sideway",
        ema20: 0,
        ema50: 0,
        ema200: 0,
        source: "fallback",
      });
    }

    const prices = result.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
    const lastClose = prices.at(-1) || 0;

    // ✅ คำนวณ RSI (14 period)
    const calcRSI = (arr, period = 14) => {
      if (arr.length < period + 1) return 50;
      let gains = 0, losses = 0;
      for (let i = arr.length - period; i < arr.length; i++) {
        const diff = arr[i] - arr[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - 100 / (1 + rs);
    };
    const rsi = Number(calcRSI(prices, 14).toFixed(2));

    // ✅ คำนวณ EMA
    const calcEMA = (arr, period) => {
      if (arr.length < period) return lastClose;
      const k = 2 / (period + 1);
      let ema = arr[0];
      for (let i = 1; i < arr.length; i++) {
        ema = arr[i] * k + ema * (1 - k);
      }
      return ema.toFixed(2);
    };
    const ema20 = calcEMA(prices, 20);
    const ema50 = calcEMA(prices, 50);
    const ema200 = calcEMA(prices, 200);

    // ✅ วิเคราะห์แนวโน้ม (Trend)
    let trend = "Sideway";
    if (lastClose > ema20 && ema20 > ema50) trend = "Uptrend";
    else if (lastClose < ema20 && ema20 < ema50) trend = "Downtrend";

    res.status(200).json({
      symbol,
      type,
      lastClose: Number(lastClose.toFixed(2)),
      rsi,
      trend,
      ema20: Number(ema20),
      ema50: Number(ema50),
      ema200: Number(ema200),
      source: "Yahoo Finance",
    });
  } catch (err) {
    // ✅ fallback ถ้า fetch ล้มเหลว
    console.error("Visionary Core Error:", err.message);
    res.status(200).json({
      symbol,
      lastClose: 0,
      rsi: 50,
      trend: "Sideway",
      ema20: 0,
      ema50: 0,
      ema200: 0,
      source: "error-fallback",
      message: err.message,
    });
  }
}
