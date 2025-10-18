// ✅ /pages/api/ai-visionary-score.js — รวมทุกมิติของ AI ความคิด
export default async function handler(req, res) {
  try {
    const brain = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/ai-brain`).then(r => r.json());
    const visionary = brain.visionary || [];

    const scored = visionary.map((v) => ({
      symbol: v.symbol,
      price: v.price,
      signal: v.signal,
      aiIQ: v.aiIQ,
      visionaryScore: Math.round(
        (v.aiIQ * 0.4 + v.innovation * 0.3 + v.futureImpact * 0.3)
      ),
    }));

    res.status(200).json({
      updated: new Date().toISOString(),
      ranked: scored.sort((a, b) => b.visionaryScore - a.visionaryScore).slice(0, 30),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
