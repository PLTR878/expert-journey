// ✅ /pages/api/ai-visionary.js — ใช้ Twelve Data + GPT วิเคราะห์หุ้น
export default async function handler(req, res) {
  try {
    let symbol = "PLTR";
    let prompt = "วิเคราะห์แนวโน้มวันนี้";

    if (req.method === "POST") {
      const body = req.body;
      if (body.symbol) symbol = body.symbol.toUpperCase();
      if (body.prompt) prompt = body.prompt;
    } else if (req.query.symbol) {
      symbol = req.query.symbol.toUpperCase();
      prompt = req.query.prompt || prompt;
    }

    // ✅ ดึงข้อมูลหุ้นจาก Twelve Data
    const stockRes = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${process.env.TWELVE_API_KEY}`
    );
    const stockJson = await stockRes.json();

    if (!stockJson || !stockJson.symbol)
      return res.status(404).json({ success: false, error: "ไม่พบข้อมูลหุ้น" });

    const summary = `
หุ้น: ${stockJson.name || symbol}
ราคา: $${stockJson.price}
เปลี่ยนแปลง: ${stockJson.percent_change}%
สูงสุด/ต่ำสุด: ${stockJson.high} / ${stockJson.low}
ปริมาณ: ${stockJson.volume}
คำถาม: ${prompt}
`;

    // ✅ วิเคราะห์ด้วย GPT
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "คุณคือผู้ช่วยวิเคราะห์หุ้นระดับมืออาชีพ" },
          { role: "user", content: summary },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const result = aiData.choices?.[0]?.message?.content || "ไม่มีคำตอบจาก AI";

    res.status(200).json({
      success: true,
      quote: {
        symbol,
        price: stockJson.price,
        change: stockJson.percent_change,
      },
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
