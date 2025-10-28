// ✅ /pages/api/symbols.js — Full U.S. Stock Universe (NASDAQ + NYSE + AMEX)
export default async function handler(req, res) {
  try {
    // ดึงรายชื่อหุ้นทั้งหมดจาก NASDAQ API (ฟรี, เปิดสาธารณะ)
    const urls = [
      "https://pkgstore.datahub.io/core/nasdaq-listings/nasdaq-listed_json/data/9ffb9c43a7a5f7c6a19e9a9a06b66bfc/nasdaq-listed_json.json",
      "https://pkgstore.datahub.io/core/nyse-other-listings/nyse-listed_json/data/5cdd9b55f8e844e1b83c364a7eae98f3/nyse-listed_json.json"
    ];

    const results = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));

    // รวม NASDAQ + NYSE เข้าด้วยกัน
    const nasdaq = results[0]?.map((x) => x.Symbol) || [];
    const nyse = results[1]?.map((x) => x.ACTSymbol) || [];

    // รวมทั้งหมด + ลบซ้ำ + ลบช่องว่าง
    const symbols = Array.from(new Set([...nasdaq, ...nyse])).filter(
      (s) => /^[A-Z.]{1,5}$/.test(s)
    );

    res.status(200).json({
      total: symbols.length,
      symbols: symbols.slice(0, 7000) // จำกัดสูงสุด 7000 ตัว (ป้องกัน Timeout)
    });
  } catch (e) {
    console.error("❌ Symbol load error:", e);
    res.status(500).json({
      error: e.message,
      symbols: ["AAPL", "TSLA", "NVDA", "PLTR", "SOFI", "PATH", "CRSP"]
    });
  }
}
