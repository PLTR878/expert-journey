// ✅ Visionary AI Backend API — ใช้เรียก GPT-5 โดยตรง
export default async function handler(req, res) {
  try {
    const { prompt } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "คุณคือ Visionary AI — วิเคราะห์หุ้น ออปชั่น และแนวโน้มราคาอย่างแม่นยำ",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    res.status(200).json({ result: data.choices?.[0]?.message?.content || "ไม่มีคำตอบครับ" });
  } catch (err) {
    console.error("❌ AI Error:", err);
    res.status(500).json({ error: "AI Server Error" });
  }
}
