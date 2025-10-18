// /lib/indicators.js
export function ema(values, period) {
  const k = 2 / (period + 1);
  let emaPrev = values[0];
  return values.map((v, i) => {
    if (i === 0) return v;
    emaPrev = v * k + emaPrev * (1 - k);
    return emaPrev;
  });
}

export function rsi(close, period = 14) {
  if (close.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = close[i] - close[i - 1];
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < close.length; i++) {
    const ch = close[i] - close[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, ch)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -ch)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function scoreSignal({ c, ema20, ema50, ema200, rsi14 }) {
  let s = 0;
  if (rsi14 > 35 && rsi14 < 60) s += 2;                 // โซนรีบาวด์–โมเมนตัม
  if (c > ema20) s += 1;
  if (c > ema50) s += 1.5;
  if (ema20 > ema50) s += 0.5;
  if (c > ema200) s += 1;
  return s; // มากสุด ~6
      }
