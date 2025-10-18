// ✅ /lib/indicators.js — Stable Version (แก้ slice/macd/atr ครบ)
export function ema(values, period = 14) {
  if (!values || values.length < period) return [];
  const k = 2 / (period + 1);
  let emaArray = [];
  let prevEma = values[0];
  for (let i = 0; i < values.length; i++) {
    const price = values[i];
    prevEma = price * k + prevEma * (1 - k);
    emaArray.push(prevEma);
  }
  return emaArray;
}

export function rsi(values, period = 14) {
  if (!values || values.length < period + 1) return [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rsiArray = [];

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiArray.push(100 - 100 / (1 + rs));
  }

  return rsiArray;
}

export function macd(values, short = 12, long = 26, signal = 9) {
  if (!values || values.length < long + signal) return { line: [], signal: [], hist: [] };
  const emaShort = ema(values, short);
  const emaLong = ema(values, long);
  const macdLine = emaShort.map((v, i) => v - (emaLong[i] || 0));
  const signalLine = ema(macdLine.slice(long - short), signal);
  const hist = macdLine.slice(long - short).map((v, i) => v - (signalLine[i] || 0));
  return { line: macdLine, signal: signalLine, hist };
}

export function atr(high, low, close, period = 14) {
  if (!high || !low || !close || close.length < period + 1) return [];
  const tr = [];
  for (let i = 1; i < close.length; i++) {
    const highLow = high[i] - low[i];
    const highClose = Math.abs(high[i] - close[i - 1]);
    const lowClose = Math.abs(low[i] - close[i - 1]);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  const atrArray = [];
  let prevATR = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atrArray.push(prevATR);
  for (let i = period; i < tr.length; i++) {
    const currentATR = (prevATR * (period - 1) + tr[i]) / period;
    atrArray.push(currentATR);
    prevATR = currentATR;
  }
  return atrArray;
}
