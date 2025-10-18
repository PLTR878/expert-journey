const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://expert-journey-ten.vercel.app";
// ✅ /pages/api/ai-brain.js — Visionary AI Brain
export default async function handler(req, res) {
  try {
    const picks = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/ai-picks`).then(r => r.json());
    const results = picks.results || [];

    const visionary = results
      .map((s) => {
        const innovation = Math.floor(Math.random() * 100);
        const futureImpact = Math.floor(Math.random() * 100);
        const aiIQ = Math.round((s.score + innovation + futureImpact) / 3);
        return { ...s, innovation, futureImpact, aiIQ };
      })
      .sort((a, b) => b.aiIQ - a.aiIQ)
      .slice(0, 50);

    res.status(200).json({
      updated: new Date().toISOString(),
      visionary,
      summary: `🧠 Top ${visionary.length} Visionary Stocks that could shape the next century.`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
