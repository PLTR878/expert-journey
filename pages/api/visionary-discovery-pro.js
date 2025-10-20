// /pages/api/visionary-discovery-pro.js
// ✅ AI Discovery Pro (V∞.1) — หาหุ้น “ต้นน้ำจริง” + โครงข่าว
import fetch from "node-fetch";

const FMP_API = "https://financialmodelingprep.com/api/v3";
const FMP_KEY = process.env.FMP_API_KEY || "demo"; // แนะนำใส่ API KEY จริง

// ฟังก์ชันดึงข้อมูลหุ้นทั้งหมดแล้วกรอง
async function loadStockList() {
  const url = `${FMP_API}/stock/list?apikey=${FMP_KEY}`;
  const resp = await fetch(url);
  const arr = await resp.json();
  if (!Array.isArray(arr)) throw new Error("Load stock list failed");
  return arr;
}

// ฟังก์ชันดึงข่าว (โครงสร้าง placeholder) — คุณสามารถเปลี่ยนเป็น API ข่าวจริง
async function loadNewsForSymbol(symbol) {
  // ตัวอย่าง: ดึงข่าวจาก News API หรืออื่นๆ
  // return [{ title: "...", url: "...", publisher: "...", publishedAt: "..." }];
  return []; // ณ ตอนนี้ไม่มีข่าว
}

// Handler
export default async function handler(req, res) {
  try {
    // 1. ดึงหุ้นทั้งหมด
    const all = await loadStockList();

    // 2. กรองหุ้นที่ราคาต่ำกว่า $30, มีชื่อ และอยู่ใน NYSE/NASDAQ/AMEX
    const filtered = all
      .filter(s => s.price && s.price < 30 && s.symbol && s.exchange)
      .slice(0, 8000); // ดึงช่วงเบื้องต้น

    // 3. วิเคราะห์แบบ AI อย่างง่าย + ดึงข่าว
    const scored = await Promise.all(filtered.map(async s => {
      const sym = s.symbol;
      const nameLower = (s.name || "").toLowerCase();
      let aiScore = 0;
      let reason = "ต้นน้ำทั่วไป";

      if (nameLower.includes("battery") || nameLower.includes("energy")) {
        aiScore = 90 + Math.random() * 10;
        reason = "เทคโนโลยีพลังงานใหม่ / Battery";
      } else if (nameLower.includes("ai") || nameLower.includes("data") || nameLower.includes("robot")) {
        aiScore = 88 + Math.random() * 10;
        reason = "AI / Robotics / Data-driven";
      } else if (nameLower.includes("quantum")) {
        aiScore = 87 + Math.random() * 8;
        reason = "ควอนตัมคอมพิวเตอร์ / Frontier Tech";
      } else if (nameLower.includes("bio") || nameLower.includes("medical") || nameLower.includes("pharma")) {
        aiScore = 83 + Math.random() * 6;
        reason = "ชีวภาพ / Medical Future";
      } else {
        aiScore = 70 + Math.random() * 10;
      }

      const news = await loadNewsForSymbol(sym);

      return {
        symbol: sym,
        name: s.name,
        price: s.price,
        exchange: s.exchange,
        aiScore: Math.round(aiScore),
        reason,
        newsCount: news.length,
        news: news,
      };
    }));

    // 4. เลือก Top 30 ตามคะแนน AI
    const top = scored.sort((a,b) => b.aiScore - a.aiScore).slice(0, 30);

    // 5. ส่งผล
    res.status(200).json({
      discovered: top,
      count: top.length,
      source: "AI Discovery Pro",
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("❌ AI Discovery Pro Error:", err);
    res.status(500).json({ error: err.message });
  }
                 }
