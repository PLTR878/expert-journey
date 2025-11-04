// ✅ Visionary Option AI — วิเคราะห์หุ้นรายตัวด้วย GPT-5
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { symbol = "PLTR" } = req.query;

    const prompt = `
      วิเคราะห์หุ้น ${symbol} แบบมืออาชีพ:
      • แนวโน้มระยะสั้น (2–7 วัน)
      • แนวโน้มระยะกลาง (1–2 เดือน)
      • แนวโน้มระยะยาว (6–12 เดือน)
      • แนวรับ / แนวต้าน / ราคาเป้าหมาย (TP)
      • คำแนะนำเข้าซื้อหรือถือ
      ตอบสั้น กระชับ พร้อมราคาประมาณการ
    `;

    const response = await client.responses.create({
      model: "gpt-5",
      input: prompt,
    });

    res.status(200).json({
      symbol,
      aiAnalysis: response.output_text || "ไม่สามารถวิเคราะห์ได้ในขณะนี้",
    });
  } catch (err) {
    console.error("❌ Option AI Error:", err);
    res.status(500).json({ error: "AI connection failed" });
  }
}
