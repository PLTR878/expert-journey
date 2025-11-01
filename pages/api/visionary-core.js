// ✅ OriginX AI v∞.999 — The Final Evolution (Integrated Edition)
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { symbol = "AAPL" } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  const api = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;

  try {
    // ดึงข้อมูลจาก Yahoo Finance
    const r = await fetch(api);
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) throw new Error("No chart data");
    const prices = result.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
    const price = prices.at(-1);
    const prev = prices.at(-2) || price;

    // === EMA ===
    const ema = (arr, len) => {
      const k = 2 / (len + 1);
      return arr.reduce((p, c) => p * (1 - k) + c * k);
    };
    const ema20 = ema(prices.slice(-20), 20);
    const ema50 = ema(prices.slice(-50), 50);
    const ema200 = ema(prices.slice(-200), 200);

    // === RSI ===
    const gains = [], losses = [];
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      diff >= 0 ? gains.push(diff) : losses.push(Math.abs(diff));
    }
    const avgGain = gains.reduce((a, b) => a + b, 0) / (gains.length || 1);
    const avgLoss = losses.reduce((a, b) => a + b, 0) / (losses.length || 1);
    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - 100 / (1 + rs);

    // === แนวโน้มหลัก ===
    const trend =
      ema20 > ema50 && ema50 > ema200
        ? "Uptrend"
        : ema20 < ema50 && ema50 < ema200
        ? "Downtrend"
        : "Sideway";

    // === Momentum ===
    const change = ((price - prev) / prev) * 100;

    // === Memory Layer ===
    const dataDir = path.join(process.cwd(), "data");
    const memFile = path.join(dataDir, "memory.json");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (!fs.existsSync(memFile)) fs.writeFileSync(memFile, "{}");
    const memory = JSON.parse(fs.readFileSync(memFile, "utf8"));
    const old = memory[symbol] || {};

    // === Sentiment จำลอง (เรียนรู้จากผลก่อนหน้า) ===
    let sentiment = old.sentiment || 50;
    sentiment += trend === "Uptrend" ? 10 : trend === "Downtrend" ? -10 : 0;
    sentiment += change > 1 ? 5 : change < -1 ? -5 : 0;
    sentiment = Math.max(0, Math.min(100, sentiment));

    // === AI Core Logic ===
    let aiScore = Math.min(
      100,
      (rsi > 45 && rsi < 70 ? 60 : 40) +
        (trend === "Uptrend" ? 20 : 0) +
        (sentiment > 60 ? 20 : 0)
    );
    const confidence = aiScore - Math.abs(rsi - 55) / 2;
    let signal = "Hold";
    if (aiScore > 80 && trend === "Uptrend" && rsi < 75) signal = "Buy";
    if (aiScore < 40 && trend === "Downtrend" && rsi > 55) signal = "Sell";

    // === เป้าหมาย / Stop ===
    const target =
      signal === "Buy"
        ? (price * 1.15).toFixed(2)
        : signal === "Sell"
        ? (price * 0.9).toFixed(2)
        : price.toFixed(2);

    const stopLoss =
      signal === "Buy"
        ? (price * 0.92).toFixed(2)
        : signal === "Sell"
        ? (price * 1.08).toFixed(2)
        : price.toFixed(2);

    // === สร้างผลลัพธ์สุดท้าย ===
    const resultData = {
      symbol,
      price: Number(price.toFixed(2)),
      ema20: ema20.toFixed(2),
      ema50: ema50.toFixed(2),
      ema200: ema200.toFixed(2),
      rsi: rsi.toFixed(2),
      trend,
      sentiment,
      aiScore,
      confidence: confidence.toFixed(1),
      change: Number(change.toFixed(2)),
      signal,
      target,
      stopLoss,
      source: "OriginX AI v∞.999 — The Final Evolution"
    };

    // บันทึก memory เพื่อให้เรียนรู้เอง
    memory[symbol] = resultData;
    fs.writeFileSync(memFile, JSON.stringify(memory, null, 2));

    // === ส่งกลับ ===
    res.status(200).json(resultData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
