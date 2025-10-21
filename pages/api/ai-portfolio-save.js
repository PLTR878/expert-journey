// ✅ /api/ai-portfolio-save.js — Create AI Portfolio JSON in /tmp
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    // รับข้อมูลจาก body (ส่งมาจากระบบสแกนหรือทดสอบ)
    const { top30 } = req.body || {};
    if (!Array.isArray(top30) || !top30.length)
      return res.status(400).json({ error: "missing top30 data" });

    const filePath = path.join("/tmp", "ai-portfolio.json");

    const data = {
      updated: new Date().toISOString(),
      top30,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    return res.status(200).json({ success: true, filePath, count: top30.length });
  } catch (err) {
    console.error("❌ Save error:", err);
    return res.status(500).json({ error: err.message });
  }
}
