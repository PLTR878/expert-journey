export default async function handler(req, res) {
  try {
    const { symbol = "PLTR" } = req.query;
    const prompt = `วิเคราะห์หุ้น ${symbol} แบบละเอียด`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "คุณคือผู้เชี่ยวชาญด้านหุ้นอเมริกา" },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    res.status(200).json({ success: true, reply: data.choices?.[0]?.message?.content || "ไม่มีข้อมูล" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
