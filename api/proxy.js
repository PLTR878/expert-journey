export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const symbol = req.query.symbol || "PLTR";
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
