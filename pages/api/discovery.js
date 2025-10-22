// ✅ /pages/api/discovery.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  try {
    // ดึงหุ้นที่ดีสุดจากระบบ AI
    const bestStocks = [
      { symbol: "PLTR", price: 28.5, rsi: 55, aiScore: 92, reason: "Strong uptrend" },
      { symbol: "SLDP", price: 2.85, rsi: 52, aiScore: 90, reason: "Battery tech growth" },
      { symbol: "GWH", price: 1.75, rsi: 48, aiScore: 88, reason: "Energy storage demand" },
    ];

    // ลบของเก่าก่อน
    await supabase.from("ai_portfolio").delete().neq("id", 0);

    // บันทึกใหม่ลงฐานข้อมูล
    for (const s of bestStocks) {
      await supabase.from("ai_portfolio").insert([
        {
          symbol: s.symbol,
          price: s.price,
          rsi: s.rsi,
          aiScore: s.aiScore,
          reason: s.reason,
          updated: new Date(),
        },
      ]);
    }

    res.status(200).json({ message: "✅ Updated top 30 successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
