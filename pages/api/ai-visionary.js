// ✅ /pages/api/ai-visionary.js — Visionary AI (Real Stock Data)
export default async function handler(req, res) {
  const { prompt = "", symbol = "PLTR" } = req.body;

  try {
    // 🔹 ดึงราคาจริงจาก quote API
    const quoteRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/quote?symbol=${symbol}`);
    const quote = await quoteRes.json();

    const context = `
    หุ้น: ${quote.name} (${quote.symbol})
    ราคา: $${quote.price}
    เปลี่ยนแปลง: ${quote.change}%
    High: ${quote.high} / Low: ${quote.low}
    ปริมาณ: ${quote.volume}
    Market Cap: ${quote.marketCap}
    เวลา: ${new Date(quote.time * 1000).toLocaleString()}

    คำถามจากผู้ใช้: ${prompt}
    โปรดวิเคราะห์แนวโน้ม (RSI, sentiment, และแนวรับแนวต้าน) สั้น 3 บรรทัด
    `;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: context }],
      }),
    });
    const data = await aiRes.json();
    const answer = data.choices?.[0]?.message?.content || "❌ ไม่มีคำตอบ";

    res.status(200).json({
      success: true,
      result: answer,
      quote,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
