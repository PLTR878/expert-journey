// /pages/api/ai-trade.js
import { ema, macd, rsi } from '../../lib/indicators';

export default async function handler(req, res) {
  try {
    const { symbol, range = '6mo', interval = '1d' } = req.query;
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const data = await fetch(`${base}/api/history?symbol=${symbol}&range=${range}&interval=${interval}`).then(r=>r.json());
    const rows = data.rows || [];
    if (!rows.length) return res.status(404).json({ error: 'no data' });

    const c = rows.map(r=>r.c);
    const e20 = ema(c, 20);
    const e50 = ema(c, 50);
    const { line, signal, hist } = macd(c, 12, 26, 9);
    const R = rsi(c, 14);

    const last = rows.at(-1);
    const prev = rows.at(-2) || last;

    // คะแนนสัญญาณ
    let score = 0;
    if (last.c > e20.at(-1)) score++;
    if (e20.at(-1) > e50.at(-1)) score++;
    if (hist.at(-1) > 0) score++;
    if (line.at(-1) > signal.at(-1)) score++;
    if (R.at(-1) > 55) score++;

    let action = 'Hold';
    let reason = 'Uptrend intact';
    let conf = (score / 5).toFixed(2);
    let entry = '-', stop = '-', target = '-';

    // ตัดสินใจ
    if (score >= 4) {
      action = 'Buy';
      reason = 'Strong bullish momentum';
      entry = last.c.toFixed(2);
      target = (last.c * 1.1).toFixed(2);
      stop = (last.c * 0.95).toFixed(2);
    } else if (score <= 1) {
      action = 'Sell';
      reason = 'Bearish reversal';
      entry = last.c.toFixed(2);
      target = (last.c * 0.9).toFixed(2);
      stop = (last.c * 1.05).toFixed(2);
    }

    res.status(200).json({
      symbol,
      action,
      reason,
      confidence: conf,
      entry,
      target,
      stop,
      lastClose: last.c
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
      }
