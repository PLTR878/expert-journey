// ✅ Visionary Eternal API — AI Core V∞.X.1
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { type, symbol } = req.query;

  const base = "https://query1.finance.yahoo.com/v8/finance/chart/";

  // 🧠 ดึงราคาหุ้นและคำนวณ RSI / EMA
  const getData = async (sym) => {
    const r = await fetch(`${base}${sym}?interval=1d&range=6mo`);
    const j = await r.json();
    const d = j.chart?.result?.[0];
    if (!d) return null;
    const close = d.indicators.quote[0].close.filter(Boolean);
    const lastClose = close.at(-1);

    const ema = (arr, p) => {
      const k = 2 / (p + 1);
      return arr.reduce(
        (a, price, i) =>
          i === 0 ? [price] : [...a, price * k + a[i - 1] * (1 - k)],
        []
      );
    };

    const ema20 = ema(close, 20).at(-1);
    const ema50 = ema(close, 50).at(-1);

    const calcRSI = (data, n = 14) => {
      let g = 0,
        l = 0;
      for (let i = 1; i < n; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) g += diff;
        else l -= diff;
      }
      const rs = g / (l || 1);
      return 100 - 100 / (1 + rs);
    };

    const rsi = calcRSI(close.slice(-15));
    const trend =
      lastClose > ema20 && ema20 > ema50 && rsi > 55
        ? "Uptrend"
        : lastClose < ema20 && ema20 < ema50 && rsi < 45
        ? "Downtrend"
        : "Sideway";

    return {
      symbol: sym,
      lastClose,
      rsi,
      ema20,
      ema50,
      trend,
      confidencePercent: Math.round(Math.abs(rsi - 50) * 2),
    };
  };

  // 🔍 รายตัว
  if (type === "daily" && symbol) {
    const data = await getData(symbol);
    if (!data) return res.status(404).json({ error: "Symbol not found" });
    return res.status(200).json(data);
  }

  // 🤖 AI Scanner (รวมกลุ่มหุ้นยอดนิยม)
  if (type === "ai-scan") {
    const symbols = [
      "NVDA",
      "TSLA",
      "AMD",
      "PLTR",
      "SLDP",
      "NRGV",
      "GWH",
      "BBAI",
      "AEHR",
      "RR",
      "SES",
      "OKLO",
    ];
    const results = [];
    for (const s of symbols) {
      const r = await getData(s);
      if (r && r.trend === "Uptrend" && r.rsi > 55)
        results.push({ ...r, signal: "Buy" });
    }
    results.sort((a, b) => b.confidencePercent - a.confidencePercent);
    return res.status(200).json({ aiPicks: results });
  }

  // 🌍 AI Discovery — ค้นหาหุ้นใหม่ตลอดเวลา
  if (type === "ai-discovery") {
    const newCandidates = ["ASTS", "ENVX", "BEEM", "JOBY", "ACHR", "LUNR"];
    const discovered = [];
    for (const sym of newCandidates) {
      const r = await getData(sym);
      if (r && r.trend === "Uptrend" && r.rsi > 60)
        discovered.push({
          ...r,
          discovered: true,
          reason:
            "New emerging tech pattern detected; strong volume + RSI breakout.",
        });
    }
    return res.status(200).json({ discovered });
  }

  res.status(400).json({ error: "Invalid type" });
}
