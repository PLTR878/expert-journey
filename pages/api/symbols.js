// pages/api/symbols.js
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const url = 'https://query1.finance.yahoo.com/v1/finance/trending/US?count=1000';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'visionary-screener/1.0 (+vercel)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(502).json({
        error: 'Upstream error',
        status: response.status,
        body: text.slice(0, 300),
      });
    }

    const data = await response.json().catch(() => ({}));
    const quotes =
      Array.isArray(data?.finance?.result?.[0]?.quotes) &&
      data.finance.result[0].quotes.length > 0
        ? data.finance.result[0].quotes
        : [];

    const seen = new Set();
    const symbols = quotes
      .map((q) => ({
        symbol: (q?.symbol || '').toUpperCase().trim(),
        name: q?.shortName || q?.longName || '',
      }))
      .filter((x) => x.symbol)
      .filter((x) => {
        if (seen.has(x.symbol)) return false;
        seen.add(x.symbol);
        return true;
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=86400'
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({ symbols });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'Yahoo timeout' });
    }
    console.error('❌ Error fetching symbols:', err);
    return res.status(500).json({ error: 'Failed to load symbols' });
  } finally {
    clearTimeout(timer);
  }
}
