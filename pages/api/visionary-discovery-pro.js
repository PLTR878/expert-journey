// ✅ AI Discovery Pro — V∞.Batch (สแกนรอบละ 300 ตัว จนครบ 7000)
import stockList from "../../lib/stocklist";
import { analyzeStock } from "../../lib/aiAnalyzer";

export default async function handler(req, res) {
  try {
    const batchSize = 300; // ✅ สแกนต่อรอบ
    const totalLimit = 7200; // ✅ รวมทั้งหมด
    const selected = stockList.slice(0, totalLimit);

    const allResults = [];
    const logs = [];

    console.time("AI Discovery Full Scan");

    // 🔁 แบ่งรอบเป็นชุดๆ
    for (let i = 0; i < selected.length; i += batchSize) {
      const batch = selected.slice(i, i + batchSize);
      logs.push(`🚀 เริ่มรอบที่ ${Math.floor(i / batchSize) + 1} (${batch.length} ตัว)`);

      const batchResults = await Promise.all(
        batch.map(async (sym) => {
          const r = await analyzeStock(sym);
          if (r && r.aiScore >= 60) {
            return { ...r, batch: Math.floor(i / batchSize) + 1 };
          }
          return null;
        })
      );

      const filtered = batchResults.filter(Boolean);
      allResults.push(...filtered);

      logs.push(`✅ รอบที่ ${Math.floor(i / batchSize) + 1} เสร็จสิ้น: พบ ${filtered.length} ตัวเด่น`);
      await new Promise((resolve) => setTimeout(resolve, 3000)); // ⏳ พัก 3 วิ ป้องกัน API ลิมิต
    }

    console.timeEnd("AI Discovery Full Scan");

    // ✅ เลือก Top 50 จากทั้งหมด
    const top50 = allResults.sort((a, b) => b.aiScore - a.aiScore).slice(0, 50);

    res.status(200).json({
      source: "AI Discovery Pro (Batch 24x300)",
      scanned: selected.length,
      found: allResults.length,
      topCount: top50.length,
      discovered: top50,
      logs,
      timestamp: new Date().toLocaleString("th-TH"),
    });
  } catch (err) {
    console.error("❌ AI Discovery Error:", err);
    res.status(500).json({ error: err.message });
  }
}
