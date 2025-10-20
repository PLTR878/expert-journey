// ✅ AI Discovery Pro — V∞.Full-Auto (สแกนหุ้นต้นน้ำ 7000 ตัว + วิเคราะห์เต็มระบบ)
import stockList from "../../lib/stocklist";
import { analyzeStock } from "../../lib/aiAnalyzer";

export default async function handler(req, res) {
  try {
    const limit = 7000; // ✅ จำนวนหุ้นที่จะสแกน (เต็มตลาด)
    const selected = stockList.slice(0, limit);

    const logs = [];
    const results = [];

    console.time("AI Discovery Scan");

    for (let i = 0; i < selected.length; i++) {
      const sym = selected[i];
      logs.push(`🧠 (${i + 1}/${selected.length}) กำลังวิเคราะห์ ${sym} ...`);
      const r = await analyzeStock(sym);

      if (r) {
        logs.push(`✅ ${sym} → Score: ${r.aiScore} | ${r.signal} | ${r.reason}`);
        if (r.aiScore > 60) results.push(r); // ✅ คัดเฉพาะหุ้นที่ AI มองว่าเด่น
      } else {
        logs.push(`⚠️ ${sym} ไม่มีข้อมูลราคาหรือวิเคราะห์ไม่ได้`);
      }
    }

    console.timeEnd("AI Discovery Scan");

    // ✅ เรียงคะแนนจากสูงไปต่ำ แล้วเลือก 50 ตัวที่ดีที่สุด
    const top50 = results.sort((a, b) => b.aiScore - a.aiScore).slice(0, 50);

    res.status(200).json({
      source: "AI Discovery Pro V∞.Full-Auto",
      totalScanned: selected.length,
      found: results.length,
      topCount: top50.length,
      discovered: top50,
      timestamp: new Date().toLocaleString("th-TH"),
      logs,
    });
  } catch (err) {
    console.error("❌ AI Discovery Error:", err);
    res.status(500).json({ error: err.message });
  }
}
