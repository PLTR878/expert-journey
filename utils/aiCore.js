import { rsi, ema, macd, adx } from "./indicators";

export async function analyzeAI(prices, highs, lows, volumes, mlScore = 50) {
  const last = prices.at(-1);
  const prev = prices.at(-2);
  const change = ((last - prev) / prev) * 100;
  const rsiVal = rsi(prices, 14);
  const ema20 = ema(prices, 20);
  const ema50 = ema(prices, 50);
  const macdVal = macd(prices);
  const adxVal = adx(highs, lows, prices, 14);

  const avgVol = volumes.slice(-10).reduce((a,b)=>a+b,0)/10;
  const volSpike = volumes.at(-1) > avgVol * 1.8;

  let aiScore =
    0.5*mlScore +
    0.2*(ema20>ema50?100:0) +
    0.1*(macdVal.histogram>0?100:0) +
    0.1*(rsiVal<40?100:0) +
    0.1*(volSpike?100:0);

  aiScore = Math.round(Math.min(100, Math.max(0, aiScore)));

  let signal="HOLD",reason="แนวโน้มไม่ชัด";
  if (aiScore>70 && change>0) {signal="BUY";reason="AI และ ML ยืนยันขาขึ้น";}
  else if (aiScore<35 && change<0){signal="SELL";reason="AI และ ML ยืนยันขาลง";}

  return { signal, aiScore, rsi:rsiVal, macd:macdVal.histogram, adx:adxVal, change, reason };
}
