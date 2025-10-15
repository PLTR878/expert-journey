// pages/api/symbols.js
export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ✅ โหลดหุ้นทั้งหมดจาก NASDAQ / NYSE / AMEX ผ่าน NASDAQ FTP JSON
    const urls = [
      "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt",
      "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt"
    ];

    let symbols = [];

    for (const url of urls) {
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split("\n").slice(1); // ข้าม header
      for (const line of lines) {
        const [symbol, name, , , , , , , , ,] = line.split("|");
        if (symbol && /^[A-Z]{1,6}$/.test(symbol)) {
          symbols.push({ symbol, name });
        }
      }
    }

    // ✅ ลบตัวซ้ำ
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

    // ✅ ตั้ง cache 24 ชั่วโมง (Vercel edge)
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=43200"
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(200).json({
      count: symbols.length,
      source: "NASDAQ/NYSE",
      symbols,
    });
  } catch (err) {
    console.error("❌ Error fetching stock list:", err);
    return res.status(500).json({ error: "Failed to load stock symbols" });
  }
        }
