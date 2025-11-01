// ✅ /pages/api/visionary-core.js — OriginX Self-Learning v∞.6
import fs from "fs";
import path from "path";

const MEMORY_PATH = path.join(process.cwd(), "data", "ai-memory.json");

// 🧠 โหลดไฟล์ความจำ (ถ้ายังไม่มีจะสร้างใหม่)
function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_PATH)) fs.writeFileSync(MEMORY_PATH, JSON.stringify({}));
    const raw = fs.readFileSync(MEMORY_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

// 💾 บันทึกกลับ
function saveMemory(data) {
  try {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Save memory error:", e);
  }
}

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  try {
    // --- โหลดความจำ AI ---
    const memory = loadMemory();
    const mem = memory[symbol] || { total: 0, correct: 0, lastPrice: null, lastSignal: "Hold" };

    // --- ดึงข้อมูลจาก Yahoo ---
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    const r = await fetch(url);
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("No data");

    const q = result.indicators?.quote?.[0] || {};
    const prices = q.close?.filter(Boolean) || [];
    const lastClose = prices.at(-1);
    const prevClose = prices.at(-2) || lastClose;
    const change = ((lastClose - prevClose) / prevClose) * 100;

    // --- Indicator ---
    const rsi = calcRSI(prices, 14);
    const ema20 = calcEMA(prices, 20);
    const ema50 = calcEMA(prices, 50);
    const ema200 = calcEMA(prices, 200);

    const trend =
      lastClose > ema20 && ema20 > ema50 ? "Uptrend" :
      lastClose < ema20 && ema20 < ema50 ? "Downtrend" : "Sideway";

    // --- สร้างคะแนนพื้นฐาน ---
    let aiScore = 50;
    aiScore += trend === "Uptrend" ? 15 : trend === "Downtrend" ? -15 : 0;
    aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
    aiScore += rsi < 40 ? 10 : rsi > 70 ? -10 : 0;

    // --- ตัดสินสัญญาณ ---
    let signal = "Hold";
    if (aiScore >= 70 && rsi < 70 && trend === "Uptrend") signal = "Buy";
    else if (aiScore <= 30 && rsi > 55 && trend === "Downtrend") signal = "Sell";

    // --- ตรวจผลย้อนหลังเพื่อเรียนรู้ ---
    if (mem.lastSignal && mem.lastPrice) {
      const wasBuy = mem.lastSignal === "Buy";
      const wasSell = mem.lastSignal === "Sell";
      const movedUp = lastClose > mem.lastPrice;
      const movedDown = lastClose < mem.lastPrice;
      if ((wasBuy && movedUp) || (wasSell && movedDown)) mem.correct++;
      mem.total++;
    }

    // --- อัปเดตความจำ ---
    mem.lastSignal = signal;
    mem.lastPrice = lastClose;
    memory[symbol] = mem;
    saveMemory(memory);

    // --- คำนวณความแม่นของ AI ---
    const learnedAcc = mem.total ? (mem.correct / mem.total) * 100 : 60;
    const confidence = Math.round((aiScore + learnedAcc) / 2);

    // --- ส่งออกผล ---
    res.status(200).json({
      symbol,
      lastClose: Number(lastClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      rsi: Number(rsi.toFixed(2)),
      ema20,
      ema50,
      ema200,
      trend,
      signal,
      confidence,
      accuracy: Math.round(learnedAcc),
      chart: {
        timestamps: result.timestamp,
        prices,
        open: q.open,
        high: q.high,
        low: q.low,
        volume: q.volume,
      },
      source: "OriginX Self-Learning AI v∞.6",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ===== Helper functions =====
function calcRSI(prices, period = 14) {
  if (prices.length < period) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const rs = gains / (losses || 1e-9);
  return 100 - 100 / (1 + rs);
}

function calcEMA(prices, period) {
  if (prices.length < period) return prices.at(-1);
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return Number(ema.toFixed(2));
      }
