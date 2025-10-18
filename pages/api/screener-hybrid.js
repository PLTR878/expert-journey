// ✅ /pages/api/screener-hybrid.js — เชื่อมทุก AI เข้ากับหน้าเว็บ
export default async function handler(req, res) {
  try {
    const ai = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/ai-visionary-score`).then(r => r.json());
    const list = ai.ranked || [];

    const groups = {
      fast: list.slice(0, 10),
      emerging: list.slice(10, 20),
      future: list.slice(20, 25),
      hidden: list.slice(25, 30),
    };

    res.status(200).json({
      updated: new Date().toISOString(),
      groups,
      message: "🧠 Visionary Screener fully linked with AI Brain.",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
