// ✅ Eternal AI Super Investor v∞.99 — The Ultimate Investor Brain
import { rsi, ema, macd, adx } from "./indicators";

export function analyzeAI(prices, highs, lows, volumes, fundamentals = {}) {
  // ====== Core Market Data ======
  const last = prices.at(-1);
  const prev = prices.at(-2);
  const change = ((last - prev) / prev) * 100;

  // ====== Technical Indicators ======
  const rsiVal = rsi(prices, 14);
  const ema20 = ema(prices, 20);
  const ema50 = ema(prices, 50);
  const macdVal = macd(prices);
  const adxVal = adx(highs, lows, prices, 14);

  const avgVol = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const volSpike = volumes.at(-1) > avgVol * 1.8;

  // ====== Fundamental Intelligence ======
  const marketCap = fundamentals.marketCap || 0;
  const revenueGrowth = fundamentals.revenueGrowth || 0;
  const epsGrowth = fundamentals.epsGrowth || 0;
  const profitMargin = fundamentals.profitMargin || 0;
  const sector = (fundamentals.sector || "").toLowerCase();

  let fScore = 0;
  if (marketCap > 10_000_000_000) fScore += 10; // บริษัทใหญ่มีเสถียรภาพ
  if (revenueGrowth > 10) fScore += 15; // รายได้โตจริง
  if (epsGrowth > 5) fScore += 10; // กำไรโต
  if (profitMargin > 5) fScore += 10; // ธุรกิจทำกำไร
  if (["ai", "semiconductor", "ev", "energy", "battery", "space", "biotech"].some(s => sector.includes(s)))
    fScore += 20; // กลุ่มแห่งอนาคต

  // ====== Future Potential (Sector Impact) ======
  const innovationBoost =
    sector.includes("ai") ? 25 :
    sector.includes("ev") ? 20 :
    sector.includes("semiconductor") ? 15 :
    sector.includes("energy") ? 15 :
    sector.includes("biotech") ? 10 : 0;

  // ====== AI Power Score (Fusion of All Intelligence) ======
  let aiScore =
    50 +
    (ema20 > ema50 ? 10 : -10) +
    (macdVal.histogram > 0 ? 10 : -10) +
    (rsiVal < 40 ? 5 : 0) +
    (rsiVal > 70 ? -10 : 0) +
    (volSpike ? 5 : 0) +
    (adxVal > 25 ? 5 : 0) +
    (fScore * 0.6) +
    (innovationBoost * 0.8) +
    (change > 1 ? 5 : change < -1 ? -5 : 0);

  aiScore = Math.max(0, Math.min(100, aiScore));

  // ====== Smart Decision Engine ======
  let signal = "HOLD";
  let reason = "ตลาดยังไม่ชัดเจน";

  if (aiScore >= 75 && change > 0 && rsiVal < 65) {
    signal = "BUY";
    reason = "AI พบแนวโน้มขาขึ้นแข็งแรง + พื้นฐานดี + ศักยภาพอนาคตสูง";
  } else if (aiScore <= 35 || (rsiVal > 70 && change < 0)) {
    signal = "SELL";
    reason = "แรงขายกดดัน + แนวโน้มอ่อนแรง + ความเสี่ยงสูง";
  }

  return {
    signal,
    aiScore: Math.round(aiScore),
    rsi: Math.round(rsiVal),
    macd: macdVal.histogram.toFixed(2),
    adx: Math.round(adxVal),
    change: change.toFixed(2),
    reason,
  };
}
