// /lib/indicators.js
// เครื่องมือคำนวณ indicator พื้นฐานที่ใช้ใน screener.js

export function ema(values, period = 14) {
  if (!Array.isArray(values) || values.length < period) return [];
  const k = 2 / (period + 1);
  const emaArr = [];
  let prevEma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaArr[period - 1] = prevEma;
  for (let i = period; i < values.length; i++) {
    const emaVal = values[i] * k + prevEma * (1 - k);
    emaArr.push(emaVal);
    prevEma = emaVal;
  }
  return emaArr;
}

export function rsi(values, period = 14) {
  if (!Array.isArray(values) || values.length < period + 1) return [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rsis = [];
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    rsis.push(rs);
  }
  return rsis;
}

export function macd(values, fast = 12, slow = 26, signal = 9) {
  if (!Array.isArray(values) || values.length < slow) return { line: [], signal: [], hist: [] };
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const line = fastEma.slice(-slowEma.length).map((v, i) => v - slowEma[i]);
  const signalLine = ema(line, signal);
  const hist = line.slice(-signalLine.length).map((v, i) => v - signalLine[i]);
  return { line, signal: signalLine, hist };
}
