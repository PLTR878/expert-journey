export default async function handler(req, res) {
  try {
    const { symbol } = req.query;
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`;
    const r = await fetch(url);
    const j = await r.json();
    const items = j.news || [];
    const filtered = items.slice(0, 5).map(n => ({
      title: n.title,
      link: n.link,
      publisher: n.publisher,
      published: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toLocaleString()
        : '',
    }));
    res.status(200).json({ items: filtered });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
