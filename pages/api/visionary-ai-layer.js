// ✅ Visionary AI Layer — ต่อ GPT-5 กับผลสแกนเดิม (ไม่แตะระบบหลัก)
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    // ดึงผลจาก batch เดิม (ของพี่)
    const r = await fetch(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/visionary-batch?batch=1`);
    const j = await r.json();

    const top = j.results?.slice(0, 5)?.map(x => x.symbol).join(", ") || "ไม่มีข้อมูล";
    const prompt = `
      วิเคราะห์หุ้น ${top} จากผลสแกนเทคนิคอล:
      - แนวโน้มกลุ่ม
      - ตัวเด่นสุด และเหตุผล
      - คาดการณ์ช่วง 1-2 เดือน
      - แนวรับ แนวต้าน TP โดยประมาณ
      ตอบแบบสั้น กระชับ เหมาะกับหน้า OriginX
    `;

    const ai = await client.responses.create({
      model: "gpt-5",
      input: prompt,
    });

    res.status(200).json({
      success: true,
      fromBatch: j.results?.length || 0,
      summary: ai.output_text || "AI ไม่สามารถวิเคราะห์ได้",
    });
  } catch (e) {
    console.error("❌ AI Layer Error:", e);
    res.status(500).json({ error: e.message });
  }
}
