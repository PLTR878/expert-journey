// ✅ /pages/api/ai-visionary.js — แก้ e.json is not a function
export default async function handler(req, res) {
  try {
    let symbol = "PLTR";
    let prompt = "วิเคราะห์แนวโน้มวันนี้";

    if (req.method === "POST") {
      const body = req.body;
      if (body.symbol) symbol = body.symbol;
      if (body.prompt) prompt = body.prompt;
    } else if (req.query.symbol) {
      symbol = req.query.symbol;
      prompt = req.query.prompt || prompt;
    }

    // ✅ ดึงราคาหุ้นจริงจาก Yahoo
    const quoteRes = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
    );
    const quoteJson = await quoteRes.json();
    const q = quoteJson?.quoteResponse?.result?.[0];
    if (!q)
      return res.status(404).json({ success: false, error: "ไม่พบข้อมูลหุ้น" });

    const summary = `
หุ้น: ${q.shortName || symbol}
ราคา: $${q.regularMarketPrice} (${q.regularMarketChangePercent}%)
สูงสุด/ต่ำสุด: ${q.regularMarketDayHigh} / ${q.regularMarketDayLow}
ปริมาณ: ${q.regularMarketVolume}
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
        price: q.regularMarketPrice,
        change: q.regularMarketChangePercent,
      },
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
