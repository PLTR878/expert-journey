// pages/api/symbols.js
let cachedSymbols = null;
let lastFetchTime = 0;

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const now = Date.now();
  const cacheDuration = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

  // ✅ ถ้ามี cache และยังไม่หมดอายุ → ส่งข้อมูลเก่าเลย (เร็วสุด)
  if (cachedSymbols && now - lastFetchTime < cacheDuration) {
    return res.status(200).json({
      cached: true,
      count: cachedSymbols.length,
      source: "cache",
      symbols: cachedSymbols,
    });
  }

  try {
    // ✅ โหลดข้อมูลหุ้นจาก NASDAQ และ NYSE
    const urls = [
      "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt",
      "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt",
    ];

    let symbols = [];

    for (const url of urls) {
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split("\n").slice(1);
      for (const line of lines) {
        const [symbol, name] = line.split("|");
        if (symbol && /^[A-Z]{1,6}$/.test(symbol)) {
          symbols.push({ symbol, name });
        }
      }
    }

    // ✅ ลบหุ้นซ้ำ
    const seen = new Set();
    symbols = symbols.filter((x) => {
      if (seen.has(x.symbol)) return false;
      seen.add(x.symbol);
      return true;
    });

    // ✅ ถ้าโหลดไม่ได้ ใช้ fallback list
    if (!symbols.length) {
      symbols = [
        { symbol: "TSLA", name: "Tesla Inc" },
        { symbol: "NVDA", name: "Nvidia Corp" },
        { symbol: "AAPL", name: "Apple Inc" },
        { symbol: "PLTR", name: "Palantir Technologies" },
        { symbol: "AMD", name: "Advanced Micro Devices" },
        { symbol: "GOOG", name: "Alphabet Inc" },
        { symbol: "MSFT", name: "Microsoft Corp" },
        { symbol: "META", name: "Meta Platforms" },
      ];
    }

    // ✅ บันทึก cache ไว้ใน memory (server)
    cachedSymbols = symbols;
    lastFetchTime = now;

    // ✅ ตั้ง header cache ให้ Vercel จัดการด้วย
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=43200"
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    // ✅ ส่งผลลัพธ์กลับ
    return res.status(200).json({
      cached: false,
      count: symbols.length,
      source: "NASDAQ/NYSE",
      symbols,
    });
  } catch (err) {
    console.error("❌ Error fetching stock list:", err);
    return res.status(500).json({ error: "Failed to load stock symbols" });
  }
}
