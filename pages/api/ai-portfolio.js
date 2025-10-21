import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const file = path.join(process.cwd(), "public", "ai-portfolio.json");

    if (!fs.existsSync(file)) {
      return res.status(404).json({ error: "ยังไม่มีพอร์ต AI" });
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    res.status(200).json({ success: true, top30: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
