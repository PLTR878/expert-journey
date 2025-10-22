// ✅ /pages/api/ai-portfolio.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const filePath = path.join("/tmp", "ai-portfolio.json");

    // ถ้ายังไม่มีไฟล์ ให้ส่งค่าเริ่มต้นกลับ
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({
        updated: null,
        top30: [],
        message: "no data yet",
      });
    }

    const data = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(data);
    return res.status(200).json(json);
  } catch (err) {
    console.error("❌ Read portfolio error:", err);
    return res.status(500).json({ error: err.message });
  }
}
