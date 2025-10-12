// /pages/api/history.js
export default async function handler(req, res) {
  const { symbol, range = '6mo', interval = '1d' } = req.query || {};
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`Yahoo responded ${r.status}`);
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) throw new Error('no result');

    const ts = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const rows = ts.map((t, i) => ({
      t: (t || 0) * 1000,                // ms
      o: q.open?.[i] ?? null,
      h: q.high?.[i] ?? null,
      l: q.low?.[i] ?? null,
      c: q.close?.[i] ?? null,
      v: q.volume?.[i] ?? null,
    })).filter(r => Number.isFinite(r.c));

    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'history failed' });
  }
}
