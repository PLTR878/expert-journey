export default async function handler(req, res) {
  const { symbol } = req.query;
  try {
    const result = await fetch(`http://localhost:5000/train?symbol=${symbol}`);
    const data = await result.json();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
