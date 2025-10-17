// ✅ /pages/api/scan-latest.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const SAVE_PATH = path.join(process.cwd(), "data", "scan-latest.json");
  try {
    if (!fs.existsSync(SAVE_PATH))
      return res.status(200).json({ results: [], message: "ยังไม่มีข้อมูล" });
    const data = JSON.parse(fs.readFileSync(SAVE_PATH, "utf8"));
    res.status(200).json({ results: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
