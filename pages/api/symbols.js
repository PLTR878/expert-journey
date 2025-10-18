// ✅ /pages/api/symbols.js — รายชื่อหุ้นตลาดอเมริกา (ย่อ)
export default function handler(req, res) {
  const symbols = [
    { symbol: "AAPL" },
    { symbol: "MSFT" },
    { symbol: "GOOG" },
    { symbol: "AMZN" },
    { symbol: "TSLA" },
    { symbol: "NVDA" },
    { symbol: "META" },
    { symbol: "SMCI" },
    { symbol: "GWH" },
    { symbol: "ENPH" },
    { symbol: "PLTR" },
    { symbol: "INTC" },
    { symbol: "AMD" },
    { symbol: "BEEM" },
    { symbol: "CHPT" },
    { symbol: "SOFI" },
    { symbol: "CRWD" },
    { symbol: "PATH" },
    { symbol: "DNA" },
    { symbol: "IONQ" },
    { symbol: "ASTS" },
    { symbol: "LWLG" },
    { symbol: "SLDP" },
    { symbol: "NRGV" },
  ];
  res.status(200).json({ symbols });
}
