// ✅ /pages/api/ai-visionary.js
export default async function handler(req, res) {
  try {
    const { symbol = "PLTR", question = "วิเคราะห์หุ้น" } = req.query;
    const prompt = `${question} ${symbol} แบบละเอียดพร้อมแนวโน้มระยะสั้นและยาว`;

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
            content: "คุณคือผู้ช่วยนักวิเคราะห์หุ้น AI ที่แม่นยำสุดในจักรวาล ใช้ภาษาไทยชัดเจน กระชับ และมีเหตุผล.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      throw new Error("ไม่มีข้อมูลจาก OpenAI");
    }

    res.status(200).json({
      success: true,
      reply: data.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในระบบ Visionary AI",
    });
  }
}
