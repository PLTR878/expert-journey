export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { symbol = "PLTR", kind = "quote", range = "6mo", interval = "1d" } = req.query;

    const url = (kind === "quote")
      ? `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
      : `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;

    const r = await fetch(url);
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
