export default async function handler(req, res) {
  try {
    const capital = 10000;
    const holdings = [
      { symbol: "PLTR", hold: 20 },
      { symbol: "BBAI", hold: 50 },
      { symbol: "AI", hold: 10 }
    ];

    const query = holdings.map(h => h.symbol).join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;
    const response = await fetch(url);
    const data = await response.json();

    const stocks = data.quoteResponse.result;

    const portfolio = holdings.map(h => {
      const s = stocks.find(st => st.symbol === h.symbol);
      const price = s ? s.regularMarketPrice : 0;
      return {
        symbol: h.symbol,
        hold: h.hold,
        price,
        value: h.hold * price
      };
    });

    const total = portfolio.reduce((sum, x) => sum + x.value, 0);
    const profit = (total - capital).toFixed(2);

    res.status(200).json({
      capital,
      portfolio,
      total,
      profit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
