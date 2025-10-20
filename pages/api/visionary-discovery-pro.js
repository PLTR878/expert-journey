// ✅ visionary-discovery-pro.js — AI Discovery Pro (V∞.1)
// ดึงหุ้นต้นน้ำจริงจากตลาดอเมริกา (7000 ตัว) และคัดเฉพาะที่ราคาต่ำ < $30
// ใช้ร่วมกับ visionary-core เพื่อดึงราคาและ RSI จริง

export default async function handler(req, res) {
  try {
    // ✅ ดึงรายชื่อหุ้นจาก NASDAQ + NYSE + AMEX
    const url = "https://financialmodelingprep.com/api/v3/stock/list?apikey=demo";
    const resp = await fetch(url);
    const allStocks = await resp.json();

    if (!Array.isArray(allStocks)) throw new Error("โหลดข้อมูลหุ้นล้มเหลว");

    // ✅ กรองเฉพาะหุ้นราคาต่ำกว่า $30 และมีชื่อ
    const filtered = allStocks
      .filter((s) => s.price && s.price < 30 && s.symbol && s.exchange)
      .slice(0, 7000);

    // ✅ AI วิเคราะห์ความเป็นไปได้ (จำลองคะแนน)
    const scored = filtered.map((s) => {
      const name = (s.name || "").toLowerCase();
      let aiScore = 0;
      let reason = "ทั่วไป";

      if (name.includes("battery") || name.includes("energy")) {
        aiScore = 90 + Math.random() * 10;
        reason = "เทคโนโลยีพลังงานใหม่ / Battery";
      } else if (name.includes("ai") || name.includes("data") || name.includes("robot")) {
        aiScore = 88 + Math.random() * 10;
        reason = "AI / Robotics / Data-driven";
      } else if (name.includes("quantum")) {
        aiScore = 87 + Math.random() * 8;
        reason = "ควอนตัมคอมพิวเตอร์ / Frontier Tech";
      } else if (name.includes("medical") || name.includes("bio")) {
        aiScore = 83 + Math.random() * 6;
        reason = "เทคโนโลยีชีวภาพ / Medical Future";
      } else {
        aiScore = 70 + Math.random() * 10;
        reason = "หุ้นขนาดเล็กต้นน้ำ";
      }

      return {
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        exchange: s.exchange,
        aiScore: Math.round(aiScore),
        reason,
      };
    });

    // ✅ จัดอันดับและคัดมา Top 30
    const top = scored
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 30);

    // ✅ ส่งออกผล
    return res.status(200).json({
      discovered: top,
      count: top.length,
      source: "AI Discovery Pro",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ AI Discovery Error:", err);
    return res.status(500).json({ error: err.message });
  }
    }
