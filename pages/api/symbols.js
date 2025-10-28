// ✅ /pages/api/symbols.js — ดึงหุ้นอเมริกาทั้งตลาด (NASDAQ + NYSE)
export default async function handler(req, res) {
  try {
    const urls = [
      "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
      "https://datahub.io/core/nyse-listings/r/nyse-listed.csv",
    ];

    const allSymbols = [];

    for (const url of urls) {
      const csv = await fetch(url).then((r) => r.text());
      const lines = csv.split("\n").slice(1); // ข้าม header
      for (const line of lines) {
        const [symbol, name] = line.split(",");
        if (symbol && /^[A-Z]+$/.test(symbol)) {
          allSymbols.push({
            symbol: symbol.trim(),
            name: (name || "").trim(),
          });
        }
      }
    }

    const unique = [...new Map(allSymbols.map((x) => [x.symbol, x])).values()]
      .slice(0, 7000);

    res.status(200).json({ total: unique.length, symbols: unique });
  } catch (err) {
    console.error("❌ Symbol load failed:", err);
    res.status(500).json({ error: "Failed to load symbols" });
  }
}
