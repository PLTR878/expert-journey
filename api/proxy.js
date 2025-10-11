export const config = { runtime: "nodejs" };

async function yfetch(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; StockScanner/1.0)" }
  });
  // บางครั้ง yahoo คืน non-JSON ตอนถูกบล็อค → ป้องกัน
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

export default async function handler(req, res) {
  try {
    const { symbol = "PLTR", kind = "quote", range = "6mo", interval = "1d" } = req.query;

    if (kind === "quote") {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
      let data = await yfetch(url);

      // ถ้า yahoo ว่าง/ผิดรูปแบบ → ลอง query2 → สุดท้าย fallback stooq
      let result = data?.quoteResponse?.result;
      if (!Array.isArray(result) || result.length === 0) {
        data = await yfetch(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`);
        result = data?.quoteResponse?.result;
      }
      if (!Array.isArray(result) || result.length === 0) {
        // Fallback ราคาล่าสุดจาก Stooq (ฟรี)
        const sym = symbol.split(",")[0].toLowerCase();
        const csv = await fetch(`https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlcv&h&e=csv`).then(r=>r.text());
        // แปลงคร่าวๆ เป็นรูปแบบเดียวกับ yahoo
        const row = csv.split("\n")[1]?.split(",");
        const price = row && row[6] ? Number(row[6]) : null;
        return res.status(200).json({
          quoteResponse: { result: price!=null ? [{ symbol: symbol.toUpperCase(), regularMarketPrice: price }] : [] }
        });
      }
      return res.status(200).json(data);
    } else {
      // chart (candle)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const data = await yfetch(url);
      return res.status(200).json(data);
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
