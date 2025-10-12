// ดึงข้อมูลราคาย้อนหลังจาก Yahoo Finance
export default async function handler(req, res) {
  try {
    const { symbol, range = '6mo', interval = '1d' } = req.query;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const r = await fetch(url);
    const j = await r.json();
    const d = j?.chart?.result?.[0];
    if (!d) return res.status(404).json({ error: 'no data' });

    const rows = d.timestamp.map((t, i) => ({
      t: t * 1000,
      o: d.indicators.quote[0].open[i],
      h: d.indicators.quote[0].high[i],
      l: d.indicators.quote[0].low[i],
      c: d.indicators.quote[0].close[i],
      v: d.indicators.quote[0].volume[i],
    }));

    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
