// ✅ AI Fusion Core
import { rsi, ema, macd, adx } from "./indicators";

export function analyzeAI(prices, highs, lows, volumes) {
  const last = prices.at(-1);
  const prev = prices.at(-2);
  const change = ((last - prev) / prev) * 100;
  const rsiVal = rsi(prices, 14);
  const ema20 = ema(prices, 20);
  const ema50 = ema(prices, 50);
  const macdVal = macd(prices);
  const adxVal = adx(highs, lows, prices, 14);

  const avgVol = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const volSpike = volumes.at(-1) > avgVol * 1.8;

  let aiScore =
    50 +
    (ema20 > ema50 ? 10 : -10) +
    (macdVal.histogram > 0 ? 10 : -10) +
    (rsiVal < 40 ? 10 : 0) +
    (rsiVal > 70 ? -10 : 0) +
    (volSpike ? 10 : 0) +
    (adxVal > 25 ? 5 : 0) +
    (change > 1 ? 5 : change < -1 ? -5 : 0);

  aiScore = Math.max(0, Math.min(100, aiScore));

  let signal = "HOLD";
  let reason = "แนวโน้มไม่ชัด";

  if (aiScore > 70 && change > 0 && volSpike) {
    signal = "BUY";
    reason = "AI ขึ้นแรง + RSI ต่ำ + Volume พุ่ง";
  } else if (aiScore < 35 && change < 0 && rsiVal > 65) {
    signal = "SELL";
    reason = "AI ชี้ลง + RSI สูง + EMA50 > EMA20";
  }

  return { signal, aiScore, rsi: rsiVal, macd: macdVal.histogram, adx: adxVal, change, reason };
}
