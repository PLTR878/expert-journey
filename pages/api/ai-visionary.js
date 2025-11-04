// ✅ /pages/api/ai-visionary.js — Real AI Connection (OpenAI Linked)
export default async function handler(req, res) {
  try {
    const { symbol = "PLTR" } = req.query;

    const prompt = `วิเคราะห์หุ้น ${symbol} แบบสั้นๆ สรุปแนวโน้ม ราคา เหตุผลสำคัญ และแนวทางการเทรดเบื้องต้น ภาษาไทยแบบเข้าใจง่าย`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "คุณคือ AI วิเคราะห์หุ้นขั้นเทพ" },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "❌ ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้";

    res.status(200).json({
      success: true,
      symbol,
      aiMessage: reply,
    });
  } catch (err) {
    console.error("AI Visionary Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
