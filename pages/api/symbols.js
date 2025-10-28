// ✅ OriginX Symbol Engine — 2025 Clean Mode (Real US Stocks)
export default async function handler(req, res) {
  try {
    // ✅ แหล่งข้อมูลหลักจาก NASDAQ + NYSE official CSV
    const urls = [
      "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt",
      "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt",
    ];

    const allSymbols = [];

    for (const url of urls) {
      const text = await fetch(url).then(r => r.text());
      const lines = text.split("\n").slice(1);
      for (const line of lines) {
        const parts = line.split("|");
        const sym = parts[0]?.trim();
        if (sym && /^[A-Z]{1,5}$/.test(sym)) allSymbols.push(sym);
      }
    }

    // ✅ กรอง symbol ที่ไม่ใช่หุ้น (เช่น TEST, ZZZZ)
    const filtered = allSymbols.filter(
      (s) =>
        s.length <= 5 &&
        !s.includes(".") &&
        !s.includes("-") &&
        !s.includes("/") &&
        !["TEST", "ZZZZ", "OLD", "NEW"].includes(s)
    );

    // ✅ ตัดซ้ำ และจำกัด 7000 ตัว (สำหรับ performance)
    const unique = [...new Set(filtered)].slice(0, 7000);

    res.status(200).json({
      total: unique.length,
      symbols: unique,
    });
  } catch (err) {
    console.error("❌ Symbol load failed:", err);
    res.status(500).json({ error: "Failed to load stock symbols" });
  }
}
