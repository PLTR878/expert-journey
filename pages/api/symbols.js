// pages/api/symbols.js
export default async function handler(req, res) {
  // 1) method guard
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const url =
    'https://query1.finance.yahoo.com/v1/finance/trending/US?count=1000';

  // 2) timeout ป้องกัน request แขวน
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // 8s

  try {
    const response = await fetch(url, {
      // ระบุ UA บางครั้งช่วยลด 403
      headers: { 'User-Agent': 'visionary-screener/1.0 (+vercel)' },
      signal: controller.signal,
    });

    // 3) เช็ค response.ok
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res
        .status(502)
        .json({ error: 'Upstream error', status: response.status, body: text });
    }

    // 4) parse JSON อย่างปลอดภัย
    const data = await response.json().catch(() => ({}));

    const quotes =
      data?.finance?.result?.[0]?.quotes && Array.isArray(data.finance.result[0].quotes)
        ? data.finance.result[0].quotes
        : [];

    // 5) map + กรองว่าง + dedupe + sort
    const seen = new Set();
    const symbols = quotes
      .map((q) => ({
        symbol: (q?.symbol || '').toUpperCase().trim(),
        name: q?.shortName || q?.longName || '',
      }))
      .filter((x) => x.symbol) // ตัดรายการว่าง
      .filter((x) => {
        if (seen.has(x.symbol)) return false;
        seen.add(x.symbol);
        return true;
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    // 6) cache ผ่าน Vercel (CDN) เพื่อลดการยิง Yahoo
    //    s-maxage = 15 นาที, stale-while-revalidate = 1 วัน
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=86400'
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json({ symbols });
  } catch (err) {
    // แยกกรณี timeout ให้ชัด
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('Error fetching symbols:', err);
    return res.status(500).json({ error: 'Failed to load symbols' });
  } finally {
    clearTimeout(timer);
  }
}
