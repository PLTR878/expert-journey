// ✅ Indicators Functions
export function ema(data, period) {
  const k = 2 / (period + 1);
  let emaPrev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    emaPrev = data[i] * k + emaPrev * (1 - k);
  }
  return emaPrev;
}

export function rsi(data, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i < period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period || 0.001;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(data, short = 12, long = 26, signal = 9) {
  const emaShort = ema(data, short);
  const emaLong = ema(data, long);
  const macdLine = emaShort - emaLong;
  const signalLine = ema(data.slice(-signal), signal);
  const histogram = macdLine - signalLine;
  return { macdLine, signalLine, histogram };
}

export function adx(highs, lows, closes, period = 14) {
  let tr = [];
  for (let i = 1; i < closes.length; i++) {
    const range = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    tr.push(range);
  }
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;
  return (atr / closes.at(-1)) * 100;
    }
