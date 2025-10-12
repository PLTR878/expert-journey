// /pages/api/indicators.js
import { ema, rsi, macd, atr } from '../../lib/indicators';

export default async function handler(req, res) {
  try {
    const { symbol, range = '6mo', interval = '1d' } = req.query || {};
    if (!symbol) return res.status(400).json({ error: 'symbol is required' });

    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const j = await fetch(
      `${base}/api/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`
    ).then(r => r.json());

    const rows = j?.rows || [];
    if (!rows.length) return res.status(200).json({});

    const c = rows.map(r => r.c);
    const h = rows.map(r => r.h ?? r.c);
    const l = rows.map(r => r.l ?? r.c);

    const out = {
      lastClose: c.at(-1),
      ema20: ema(c, 20).at(-1) ?? null,
      ema50: ema(c, 50).at(-1) ?? null,
      ema200: ema(c, 200).at(-1) ?? null,
      rsi14: rsi(c, 14).at(-1) ?? null,
      macd: (() => {
        const m = macd(c, 12, 26, 9);
        return {
          line: m.line.at(-1) ?? null,
          signal: m.signal.at(-1) ?? null,
          hist: m.hist.at(-1) ?? null,
        };
      })(),
      atr14: atr(h, l, c, 14).at(-1) ?? null,
    };

    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'indicators failed' });
  }
}
