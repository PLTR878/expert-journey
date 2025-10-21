// ✅ /api/ai-portfolio.js — AI Portfolio Loader (Stable)
// ใช้ให้หน้า Home ดึงพอร์ตหุ้นต้นน้ำ (Top 30) ได้จริง
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    // 🧠 ตำแหน่งไฟล์เก็บพอร์ต (สร้างโดย cron-job หรือ AI engine)
    const filePath = path.join("/tmp", "ai-portfolio.json");

    // ถ้ายังไม่มีไฟล์ ให้คืน default ว่างๆ
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({
        top30: [],
        updated: null,
        message: "ยังไม่มีข้อมูลพอร์ต AI (ไฟล์ยังไม่ถูกสร้าง)",
      });
    }

    // อ่านข้อมูลจากไฟล์
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);

    // ถ้ามีข้อมูล top30 อยู่ในไฟล์ ให้ส่งกลับ
    return res.status(200).json({
      top30: json.top30 || [],
      updated: json.updated || null,
    });
  } catch (err) {
    console.error("❌ ai-portfolio API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
