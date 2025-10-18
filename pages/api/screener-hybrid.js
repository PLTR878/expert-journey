// ✅ /pages/api/screener-hybrid.js
export default async function handler(req, res) {
  try {
    const { mode = "short" } = req.query;
    const base = "https://expert-journey-ten.vercel.app";
    const data = await fetch(`${base}/api/ai-picks`).then(r => r.json());
    const list = data.results || [];

    let results = [];
    if (mode === "short")
      results = list.filter(x => x.signal === "Buy" && x.rsi < 60).slice(0, 25);
    else if (mode === "swing")
      results = list.filter(x => x.trend === "Uptrend" && x.signal === "Hold").slice(0, 25);
    else if (mode === "long")
      results = list.filter(x => x.confidence > 70 && x.signal === "Buy").slice(0, 25);
    else if (mode === "hidden")
      results = list.filter(x => x.price < 10 && x.signal === "Buy").slice(0, 25);

    res.status(200).json({
      updated: new Date().toISOString(),
      mode,
      count: results.length,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
