// ✅ /pages/api/symbols.js
// ดึงรายชื่อหุ้นทั้งหมดจากตลาดอเมริกา (NASDAQ + NYSE + AMEX)
export default async function handler(req, res) {
  try {
    const sources = [
      "https://financialmodelingprep.com/api/v3/nasdaq_constituent",
      "https://financialmodelingprep.com/api/v3/nyse_constituent",
      "https://financialmodelingprep.com/api/v3/amex_constituent"
    ];

    let symbols = [];
    for (const url of sources) {
      try {
        const r = await fetch(url);
        const j = await r.json();
        if (Array.isArray(j)) {
          j.forEach(x => {
            if (x.symbol && /^[A-Z.]+$/.test(x.symbol))
              symbols.push({ symbol: x.symbol });
          });
        }
      } catch (e) {
        console.log("Source error:", url);
      }
    }

    // รวม + ลบซ้ำ
    symbols = symbols.filter(
      (v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i
    );

    // ถ้ายังไม่มีข้อมูล ใช้ fallback set
    if (symbols.length === 0) {
      symbols = [
        { symbol: "AAPL" }, { symbol: "MSFT" }, { symbol: "NVDA" },
        { symbol: "PLTR" }, { symbol: "SOFI" }, { symbol: "TSLA" },
        { symbol: "AMZN" }, { symbol: "GOOG" }, { symbol: "META" },
        { symbol: "IONQ" }, { symbol: "SMCI" }, { symbol: "SLDP" },
        { symbol: "GWH" }, { symbol: "BEEM" }, { symbol: "ENVX" }
      ];
    }

    res.status(200).json({
      count: symbols.length,
      symbols
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
