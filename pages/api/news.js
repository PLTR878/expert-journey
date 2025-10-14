// /pages/api/news.js
export default async function handler(req, res) {
  try {
    const tickers = ["AAPL", "NVDA", "TSLA", "BBAI", "AMD", "IREN", "BTDR"];
    const results = [];

    for (const symbol of tickers) {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`;
      const r = await fetch(url);
      const j = await r.json();
      if (!j.news) continue;

      j.news.slice(0, 3).forEach((n) => {
        results.push({
          symbol,
          title: n.title,
          summary: n.summary || "No summary available.",
          link: n.link,
          sentiment:
            /upgrade|growth|partnership|record|expands/i.test(n.title)
              ? "Positive"
              : /drop|loss|lawsuit|warning/i.test(n.title)
              ? "Negative"
              : "Neutral",
          date: new Date().toLocaleDateString(),
        });
      });
    }

    res.status(200).json({ articles: results });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
