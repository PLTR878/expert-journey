// /lib/indicators.js
export function ema(values, period = 20) {
  if (!values?.length) return [];
  const k = 2 / (period + 1);
  const emaArr = [];
  let prevEma = values[0];
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    prevEma = val * k + prevEma * (1 - k);
    emaArr.push(prevEma);
  }
  return emaArr;
}

export function rsi(values, period = 14) {
  if (values.length < period + 1) return [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rsiArr = [100 - (100 / (1 + avgGain / avgLoss))];

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, diff)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiArr.push(100 - 100 / (1 + rs));
  }

  return Array(values.length - rsiArr.length).fill(null).concat(rsiArr);
}

export function macd(values, fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = fastEma.map((v, i) => v - slowEma[i]);
  const signalLine = ema(macdLine, signal);
  const hist = macdLine.map((v, i) => v - signalLine[i]);
  return { line: macdLine, signal: signalLine, hist };
}

export function atr(high, low, close, period = 14) {
  if (!high?.length || !low?.length || !close?.length) return [];
  const tr = high.map((h, i) =>
    Math.max(
      h - low[i],
      Math.abs(h - (close[i - 1] ?? h)),
      Math.abs(low[i] - (close[i - 1] ?? low[i]))
    )
  );
  const out = [];
  let prev = tr[0];
  for (let i = 0; i < tr.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out.push(prev);
  }
  return out;
      }
