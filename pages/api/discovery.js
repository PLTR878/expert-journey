// ✅ /pages/api/discovery.js — บันทึกหุ้น Top 30 ลง Supabase
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qdrppchwgqrnxkcnayoj.supabase.co";
const supabaseKey = "พี่ใส่ anon public key ของ Supabase ตรงนี้";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // ตัวอย่างข้อมูล Top 30 หุ้น (จำลอง)
    const top30 = [
      { symbol: "PLTR", price: 41.2, rsi: 68, aiScore: 92, reason: "AI momentum", updated: new Date().toISOString() },
      { symbol: "GWH", price: 1.58, rsi: 59, aiScore: 87, reason: "Energy storage growth", updated: new Date().toISOString() },
      { symbol: "LWLG", price: 7.45, rsi: 47, aiScore: 75, reason: "Photonics innovation", updated: new Date().toISOString() }
    ];

    // ลบของเก่าทั้งหมดก่อน
    await supabase.from("ai_portfolio").delete().neq("id", 0);

    // บันทึกข้อมูลใหม่ทั้งหมด
    const { error } = await supabase.from("ai_portfolio").insert(top30);

    if (error) throw error;

    res.status(200).json({ message: "✅ Updated top 30 successfully", count: top30.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
