// ✅ /pages/api/ai-visionary.js
export default async function handler(req, res) {
  try {
    // รับ symbol และข้อความจาก query หรือใช้ค่าเริ่มต้น
    const { symbol = "PLTR", question = "วิเคราะห์หุ้น" } = req.query;

    // Prompt ที่ส่งให้ AI
    const prompt = `${question} ${symbol} วิเคราะห์เชิงลึก หุ้นนี้แนวโน้มรายเดือน รายปี จุดเด่น ความเสี่ยง และโอกาสการเติบโต`;

    // เรียก OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "คุณคือ Visionary AI ผู้ช่วยวิเคราะห์หุ้นระดับเทพ ใช้ภาษาไทยสั้น กระชับ ชัดเจน และให้เหตุผลเชิงลึก",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    // ตรวจว่ามีคำตอบจาก API หรือไม่
    if (!data.choices || !data.choices[0]) {
      throw new Error("ไม่มีคำตอบจาก OpenAI");
    }

    // ส่งผลลัพธ์กลับไปหน้าเว็บ
    res.status(200).json({
      success: true,
      reply: data.choices[0].message.content,
    });
  } catch (err) {
    console.error("❌ Visionary API Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในระบบ Visionary AI",
    });
  }
}
