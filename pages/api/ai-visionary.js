// ✅ /pages/api/ai-visionary.js
export default async function handler(req, res) {
  try {
    const { symbol = "PLTR", question = "วิเคราะห์หุ้น" } = req.query;
    const prompt = `${question} ${symbol} แบบละเอียด`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "คุณคือผู้ช่วยด้านหุ้นและการลงทุนในตลาดสหรัฐ" },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "OpenAI error");
    }

    res.status(200).json({
      success: true,
      reply: data.choices?.[0]?.message?.content || "❌ ไม่พบคำตอบจาก AI",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
}
