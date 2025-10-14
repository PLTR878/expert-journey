export default async function handler(req, res) {
  try {
    const tickers = ["AAPL", "NVDA", "TSLA", "BBAI", "AMD", "IREN", "BTDR"];
    const responses = await Promise.all(
      tickers.map((sym) =>
        fetch(
          `https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`
        ).then((r) => r.json())
      )
    );

    const articles = responses.flatMap((r, i) => {
      const sym = tickers[i];
      return (r.news || []).slice(0, 3).map((n) => ({
        title: n.title,
        url: n.link,
        summary: n.summary || "No summary available.",
        date: new Date().toLocaleDateString(),
        sentiment:
          /upgrade|growth|partnership|surge|record/i.test(n.title)
            ? "Positive"
            : /drop|downgrade|loss|lawsuit/i.test(n.title)
            ? "Negative"
            : "Neutral",
      }));
    });

    res.status(200).json({ articles });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
