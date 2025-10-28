// ✅ Stocks Symbol List (Full Market)
export default async function handler(req, res) {
  // ตัวอย่าง mock — ภายหลังเปลี่ยนเป็น dynamic list ได้
  const symbols = [
    "AAPL","TSLA","NVDA","PLTR","SLDP","RXRX","SOFI","PATH","CRSP","ACHR",
    "BBAI","ENVX","SES","RKLB","ASTS","LWLG","WULF","DNA","BYND","HASI",
    "AXTI","LAES","NRGV","RIVN","SOUN","OSCR","CCCX"
  ];
  res.status(200).json({
    total: symbols.length,
    symbols,
  });
}
