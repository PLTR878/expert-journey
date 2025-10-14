export default async function handler(req, res) {
  try {
    const tickers = ["AAPL", "NVDA", "TSLA", "BBAI", "AMD", "IREN", "BTDR"];

    // ดึงข่าวจาก Yahoo Finance ทุกตัว
    const responses = await Promise.allSettled(
      tickers.map((sym) =>
        fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    // รวมข่าวและวิเคราะห์ sentiment
    const articles = responses.flatMap((result, i) => {
      if (result.status !== "fulfilled" || !result.value) return [];
      const sym = tickers[i];
      const newsArr = result.value.news || [];
      return newsArr.slice(0, 3).map((n) => {
        const title = n.title || "Untitled";
        const link = n.link || "#";
        const publisher = n.publisher || "Unknown";
        const time = n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleDateString();

        // วิเคราะห์ sentiment จาก keyword
        const sentiment = /upgrade|growth|surge|partnership|record|beat/i.test(
          title
        )
          ? "Positive"
          : /drop|downgrade|loss|lawsuit|decline|miss/i.test(title)
          ? "Negative"
          : "Neutral";

        return {
          symbol: sym,
          title,
          url: link,
          publisher,
          time,
          sentiment,
        };
      });
    });

    res.status(200).json({ articles });
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
