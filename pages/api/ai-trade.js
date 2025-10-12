// /pages/api/ai-trade.js
export default async function handler(req, res) {
  try {
    const { symbol } = req.query || {};
    if (!symbol) return res.status(400).json({ error: 'symbol is required' });

    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const ind = await fetch(`${base}/api/indicators?symbol=${encodeURIComponent(symbol)}`).then(r => r.json());

    const rsi = ind?.rsi14 ?? null;
    const macdHist = ind?.macd?.hist ?? null;
    const ema20 = ind?.ema20 ?? null;
    const last = ind?.lastClose ?? null;

    // กติกาอย่างง่ายแต่ใช้งานได้จริง
    let action = 'Hold';
    let reason = 'Neutral';

    if (rsi != null && macdHist != null && last != null && ema20 != null) {
      const aboveEma = last > ema20;
      if (rsi < 32 && macdHist > 0) {
        action = 'Buy';
        reason = 'RSI oversold + MACD bullish';
      } else if (rsi > 68 && macdHist < 0) {
        action = 'Sell';
        reason = 'RSI overbought + MACD bearish';
      } else if (aboveEma && macdHist >= 0) {
        action = 'Hold';
        reason = 'Uptrend intact';
      } else {
        action = 'Hold';
        reason = 'No strong edge';
      }
    }

    res.status(200).json({
      symbol,
      action,
      confidence: action === 'Hold' ? 0.55 : 0.7,
      reason,
      indicators: ind || {},
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'ai-trade failed' });
  }
}
