// ✅ /pages/api/symbols.js
export default async function handler(req, res) {
  try {
    const r = await fetch("https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=7000");
    const j = await r.json();
    const list = j.data?.rows?.map((x) => x.symbol) || [];
    res.status(200).json({ total: list.length, symbols: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
