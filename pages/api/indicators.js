import { ema, rsi, macd, atr } from '../../lib/indicators.js';

export default async function handler(req, res) {
  try {
    const { symbol, range = '6mo', interval = '1d' } = req.query;
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const h = await fetch(`${base}/api/history?symbol=${symbol}&range=${range}&interval=${interval}`).then(r=>r.json());
    const rows = h.rows || [];
    if (!rows.length) return res.status(404).json({ error: 'no data' });

    const c = rows.map(r=>r.c), hi = rows.map(r=>r.h), lo = rows.map(r=>r.l);
    const lastClose = c.at(-1);
    const ema20 = ema(c, 20).at(-1);
    const ema50 = ema(c, 50).at(-1);
    const ema200 = ema(c, 200).at(-1);
    const R = rsi(c, 14).at(-1);
    const M = macd(c, 12, 26, 9);
    const atr14 = atr(hi, lo, c, 14).at(-1);

    res.status(200).json({
      lastClose, ema20, ema50, ema200, rsi14: R,
      macd: { line: M.line.at(-1), signal: M.signal.at(-1), hist: M.hist.at(-1) },
      atr14
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
