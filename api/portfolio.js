export default function handler(req, res) {
  const capital = 10000;
  const portfolio = [
    { symbol: "PLTR", hold: 20, price: 41.25 },
    { symbol: "BBAI", hold: 50, price: 3.72 },
    { symbol: "AI", hold: 10, price: 24.18 },
  ];

  const total = portfolio.reduce((sum, x) => sum + x.hold * x.price, 0);
  const profit = (total - capital).toFixed(2);

  res.status(200).json({
    capital,
    portfolio: portfolio.map(x => ({
      ...x,
      value: x.hold * x.price,
    })),
    total,
    profit,
  });
}
