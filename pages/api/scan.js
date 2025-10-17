// ✅ /pages/api/scan.js
// Auto Scan API — สแกนหุ้นทั้งตลาดแบบ batch ฟรี 100%

export default async function handler(req, res) {
  try {
    const { cursor = 0, limit = 800 } = req.query;

    // รายชื่อหุ้นทั้งหมด (ย่อ, สามารถเพิ่มได้ถึง ~7000 ตัว)
    const allSymbols = [
      "AAPL","MSFT","NVDA","GOOG","AMZN","TSLA","META","NFLX","AMD","INTC","PLTR","SMCI","SHOP",
      "NIO","LCID","RIVN","ENPH","FSLR","RUN","GWH","NRGV","SLDP","CHPT","BEEM","BLNK","QS","DNA",
      "JOBY","ACHR","LUNR","AI","PATH","C3AI","CRWD","NET","SNOW","DDOG","OKTA","NOW","INTU","CRM",
      "ADBE","ORCL","AVGO","TXN","QCOM","MU","AMAT","LRCX","TSM","ASML","MRVL","SWKS","STM","PFE",
      "MRNA","XOM","CVX","OXY","MPC","COP","WMT","COST","PG","KO","PEP","DIS","T","VZ","V","MA",
      "AXP","JPM","BAC","C","GS","MS","WFC","SOFI","ALLY","PLUG","FCEL","NEE","BEP","GE","CAT",
      "DE","BA","LMT","RTX","NOC","HON","MMM","F","GM","TM","NKE","LULU","MCD","SBUX","AAL","DAL",
      "UAL","LUV","RCL","CCL","NCLH","MAR","HLT","H","WYNN"
    ];

    const start = parseInt(cursor);
    const end = Math.min(start + parseInt(limit), allSymbols.length);
    const batch = allSymbols.slice(start, end);

    const done = end >= allSymbols.length;
    const nextCursor = done ? null : end;
    const progress = Math.round((end / allSymbols.length) * 100);

    res.status(200).json({
      ok: true,
      batchSize: batch.length,
      symbols: batch,
      nextCursor,
      done,
      total: allSymbols.length,
      progress,
      message: done ? "✅ สแกนครบทุกตัวแล้ว" : `กำลังสแกนต่อ... (${progress}%)`,
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
      }
