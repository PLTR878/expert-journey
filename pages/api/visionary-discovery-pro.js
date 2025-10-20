// ✅ Visionary Discovery Pro (V∞.7)
// สแกนหุ้นทั้งตลาด 7000 ตัวแบบแบ่งรอบ (Batch 300 ต่อรอบ)
const FMP_API = "https://financialmodelingprep.com/api/v3";
const FMP_KEY = process.env.FMP_API_KEY || "demo";

// ฟังก์ชันดึงหุ้นทั้งหมด
async function loadStockList() {
  const url = `${FMP_API}/stock/list?apikey=${FMP_KEY}`;
  const resp = await fetch(url);
  const arr = await resp.json();
  if (!Array.isArray(arr)) throw new Error("Load stock list failed");
  return arr.filter(
    (s) =>
      s.price &&
      s.symbol &&
      s.exchange &&
      ["NASDAQ", "NYSE", "AMEX"].includes(s.exchange)
  );
}

// ฟังก์ชันคำนวณคะแนน AI สำหรับแต่ละหุ้น
function calcAIScore(name = "", price = 0) {
  const nameLower = name.toLowerCase();
  let aiScore = 0;
  let reason = "ทั่วไป";

  if (nameLower.includes("battery") || nameLower.includes("energy")) {
    aiScore = 90 + Math.random() * 10;
    reason = "เทคโนโลยีพลังงาน / Battery";
  } else if (nameLower.includes("ai") || nameLower.includes("robot")) {
    aiScore = 88 + Math.random() * 8;
    reason = "AI / Robotics / Data-driven";
  } else if (nameLower.includes("quantum")) {
    aiScore = 86 + Math.random() * 8;
    reason = "ควอนตัมคอมพิวเตอร์";
  } else if (
    nameLower.includes("bio") ||
    nameLower.includes("pharma") ||
    nameLower.includes("medical")
  ) {
    aiScore = 83 + Math.random() * 6;
    reason = "เทคโนโลยีชีวภาพ / การแพทย์";
  } else if (price < 5) {
    aiScore = 75 + Math.random() * 10;
    reason = "หุ้นเล็กศักยภาพสูง";
  } else {
    aiScore = 70 + Math.random() * 10;
  }

  return { aiScore: Math.round(aiScore), reason };
}

// ฟังก์ชันสแกน batch (300 ตัว)
async function scanBatch(stocks, start, end) {
  const sliced = stocks.slice(start, end);
  const result = [];

  for (const s of sliced) {
    const { aiScore, reason } = calcAIScore(s.name, s.price);
    result.push({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      exchange: s.exchange,
      aiScore,
      reason,
    });
  }

  return result;
}

export default async function handler(req, res) {
  try {
    console.log("🚀 AI Discovery Pro (Batch Mode) started");

    // 1️⃣ โหลดหุ้นทั้งหมด
    const all = await loadStockList();
    const total = all.length;
    console.log(`📊 Loaded ${total} stocks from FMP`);

    // 2️⃣ จำกัดสูงสุด 7000 ตัว
    const stocks = all.slice(0, 7000);

    // 3️⃣ แบ่งรอบละ 300
    const batchSize = 300;
    const batches = Math.ceil(stocks.length / batchSize);
    let discovered = [];

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = start + batchSize;
      console.log(`🔍 Scanning batch ${i + 1}/${batches} (${start}-${end})`);

      const batchResult = await scanBatch(stocks, start, end);
      discovered.push(...batchResult);

      // delay เล็กน้อยระหว่างรอบ (ไม่โดน rate limit)
      await new Promise((r) => setTimeout(r, 100));
    }

    // 4️⃣ คัด Top 50
    discovered.sort((a, b) => b.aiScore - a.aiScore);
    const top50 = discovered.slice(0, 50);

    // 5️⃣ ส่งผล
    res.status(200).json({
      discovered: top50,
      count: top50.length,
      scanned: stocks.length,
      source: "AI Discovery Pro V∞.7",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ AI Discovery Pro Error:", err);
    res.status(500).json({ error: err.message });
  }
          }
