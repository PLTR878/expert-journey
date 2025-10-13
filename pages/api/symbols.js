// pages/api/symbols.js
export const config = {
  runtime: 'nodejs', // ✅ ป้องกัน edge runtime bug ของ fetch abort
};

export default async function handler(req, res) {
  // ✅ จำกัดให้รับเฉพาะ GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const url = 'https://query1.finance.yahoo.com/v1/finance/trending/US?count=1000';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // ⏱️ timeout 8 วินาที

  try {
    console.log('🔍 Fetching trending symbols from Yahoo...');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'visionary-screener/1.0 (+vercel)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    // ✅ เช็ค response จาก Yahoo
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn('⚠️ Yahoo returned non-OK response', response.status);
      return res.status(502).json({
        error: 'Upstream error from Yahoo',
        status: response.status,
        body: text.slice(0, 300), // ป้องกัน payload ยาว
      });
    }

    // ✅ parse JSON อย่างปลอดภัย
    const data = await response.json().catch(() => ({}));
    const quotes =
      Array.isArray(data?.finance?.result?.[0]?.quotes) && data.finance.result[0].quotes.length > 0
        ? data.finance.result[0].quotes
        : [];

    // ✅ map + กรอง + ลบซ้ำ + เรียงลำดับ
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

    console.log(`✅ Loaded ${symbols.length} trending symbols from Yahoo.`);

    // ✅ Cache-Control
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=86400'
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({ symbols });
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('⏱️ Yahoo API timeout');
      return res.status(504).json({ error: 'Upstream timeout (Yahoo took too long)' });
    }

    console.error('❌ Error fetching symbols:', err);
    return res.status(500).json({ error: 'Failed to load symbols' });
  } finally {
    clearTimeout(timer);
  }
}
