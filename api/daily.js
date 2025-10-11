export default function handler(req, res) {
  res.status(200).json({
    items: [
      { symbol: "PLTR", price: 41.25, score: 96 },
      { symbol: "BBAI", price: 3.72, score: 91 },
      { symbol: "AI", price: 24.18, score: 89 },
      { symbol: "IONQ", price: 9.66, score: 86 },
      { symbol: "SMCI", price: 880.15, score: 82 },
    ]
  });
}
