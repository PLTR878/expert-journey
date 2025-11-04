// ✅ /pages/api/ai-visionary.js — Visionary AI Analyzer
export default async function handler(req, res) {
  try {
    const { symbol = "PLTR" } = req.query;

    const prompt = `วิเคราะห์หุ้น ${symbol} แบบละเอียด บอกแนวโน้ม ราคาเป้าหมาย และจุดเข้าออก`;

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
              "คุณคือ Visionary AI นักลงทุนระดับโลก วิเคราะห์หุ้นและแนวโน้มราคาด้วยความแม่นยำสูงสุด",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API Error");
    }

    res.status(200).json({
      success: true,
      symbol,
      aiMessage: data.choices?.[0]?.message?.content || "❌ ไม่มีข้อความจาก AI",
    });
  } catch (err) {
    console.error("❌ AI Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Unknown Error",
    });
  }
}
