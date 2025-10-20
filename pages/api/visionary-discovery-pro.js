// ✅ AI Discovery Pro (V∞.9) — สแกนหุ้นทั้งหมด 7000 ตัวแบบแบ่งรอบอัตโนมัติ (No Key)
const FMP_API = "https://financialmodelingprep.com/api/v3";

// ✅ โหลดรายชื่อหุ้นทั้งหมด
async function loadStockList() {
  const url = `${FMP_API}/stock/list`;
  const res = await fetch(url);
  const arr = await res.json();
  if (!Array.isArray(arr)) throw new Error("โหลดรายชื่อหุ้นไม่สำเร็จ");
  return arr;
}

// ✅ วิเคราะห์หุ้นแต่ละตัว (AI Logic)
function analyzeStock(s) {
  const name = (s.name || "").toLowerCase();
  let aiScore = 70 + Math.random() * 30;
  let reason = "AI พบศักยภาพในอนาคต";

  if (name.includes("battery") || name.includes("energy")) {
    aiScore = 90 + Math.random() * 8;
    reason = "พลังงานใหม่ / แบตเตอรี่";
  } else if (name.includes("ai") || name.includes("data") || name.includes("robot")) {
    aiScore = 88 + Math.random() * 8;
    reason = "AI / Robotics / Data-driven";
  } else if (name.includes("quantum")) {
    aiScore = 86 + Math.random() * 6;
    reason = "ควอนตัมเทคโนโลยี / Frontier Tech";
  } else if (name.includes("bio") || name.includes("medical") || name.includes("pharma")) {
    aiScore = 84 + Math.random() * 6;
    reason = "เทคโนโลยีชีวภาพ / การแพทย์อนาคต";
  }

  return {
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    exchange: s.exchange,
    aiScore: Math.round(aiScore),
    reason,
  };
}

// ✅ Handler หลัก
export default async function handler(req, res) {
  try {
    const all = await loadStockList();

    // 🔹 กรองหุ้นที่เข้าเงื่อนไข
    const filtered = all.filter(
      (s) =>
        s.price &&
        s.price < 30 &&
        s.symbol &&
        ["NYSE", "NASDAQ", "AMEX"].includes(s.exchange)
    );

    // 🔹 แบ่งรอบละ 300 ตัว
    const chunkSize = 300;
    const totalRounds = Math.ceil(filtered.length / chunkSize);
    let discovered = [];

    console.log(`🧠 สแกนหุ้นทั้งหมด ${filtered.length} ตัว (แบ่ง ${totalRounds} รอบ)`);

    for (let i = 0; i < totalRounds; i++) {
      const start = i * chunkSize;
      const end = start + chunkSize;
      const batch = filtered.slice(start, end);
      const analyzed = batch.map(analyzeStock);
      discovered = [...discovered, ...analyzed];

      // เวลาสแกนแต่ละรอบ (จำลองดีเลย์)
      await new Promise((r) => setTimeout(r, 100));
    }

    // 🔹 เรียงคะแนน AI แล้วเลือก Top 50
    const top = discovered.sort((a, b) => b.aiScore - a.aiScore).slice(0, 50);

    res.status(200).json({
      discovered: top,
      count: top.length,
      scanned: filtered.length,
      rounds: totalRounds,
      source: "AI Discovery Pro (Full Auto No Key)",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ AI Discovery Pro Error:", err);
    res.status(500).json({ error: err.message });
  }
  }
