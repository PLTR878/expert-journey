// ✅ /pages/api/ai-portfolio-save.js — สร้างไฟล์พอร์ตหุ้นต้นน้ำ
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const filePath = path.join("/tmp", "ai-portfolio.json");

    const portfolio = {
      updated: new Date().toISOString(),
      top30: [
        { symbol: "PLTR", price: 41.2, rsi: 68, signal: "Buy", reason: "AI momentum" },
        { symbol: "GWH", price: 1.58, rsi: 59, signal: "Buy", reason: "Energy storage growth" },
        { symbol: "LWLG", price: 7.45, rsi: 47, signal: "Hold", reason: "Photonics innovation" }
      ],
    };

    fs.writeFileSync(filePath, JSON.stringify(portfolio, null, 2), "utf8");
    res.status(200).json({ ok: true, message: "Portfolio saved", portfolio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
