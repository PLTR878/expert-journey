export default async function handler(req, res) {
  try {
    const url = "https://query1.finance.yahoo.com/v1/finance/trending/US?count=1000";
    const response = await fetch(url);
    const data = await response.json();

    const trending =
      data.finance.result?.[0]?.quotes?.map((q) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || "",
      })) || [];

    res.status(200).json({ symbols: trending });
  } catch (err) {
    console.error("Error fetching symbols:", err);
    res.status(500).json({ error: "Failed to load symbols" });
  }
}
