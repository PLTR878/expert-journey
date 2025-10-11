export default async function handler(req, res) {
  try {
    const symbols = ["PLTR", "BBAI", "AI", "IONQ", "SMCI"];
    const query = symbols.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;

    const response = await fetch(url);
    const data = await response.json();

    const items = data.quoteResponse.result.map(stock => ({
      symbol: stock.symbol,
      price: stock.regularMarketPrice,
      score: Math.floor(70 + Math.random() * 30) // จำลองคะแนน 70–100
    }));

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
