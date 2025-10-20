// ✅ visionary-discovery.js — AI Future Discovery Engine (V∞.7)
export default async function handler(req, res) {
  try {
    // ดึงข่าวเทคโนโลยี + หุ้น emerging sector จาก API สาธารณะ
    const newsRes = await fetch(
      "https://api.bing.com/news/search?q=future+technology+stocks+AI+EV+battery+robotics&count=50&mkt=en-US"
    );
    const news = await newsRes.json();

    // ตัวอย่างหุ้นที่ AI มองเห็นอนาคต
    const visionaryStocks = [
      { symbol: "SLDP", sector: "EV Battery", reason: "แบต solid-state พลังงานสูง", aiScore: 92 },
      { symbol: "GWH", sector: "Energy Storage", reason: "เทคโนโลยี iron-flow สำหรับกริดพลังงานสะอาด", aiScore: 88 },
      { symbol: "PLTR", sector: "AI Infrastructure", reason: "AI core สำหรับรัฐบาลและองค์กรใหญ่", aiScore: 94 },
      { symbol: "LWLG", sector: "Photonics", reason: "วัสดุโฟโตนิกส์จะปฏิวัติวงการชิป", aiScore: 90 },
      { symbol: "SES", sector: "Battery Tech", reason: "แบต hybrid lithium-metal สำหรับ EV รุ่นใหม่", aiScore: 85 },
    ];

    // ดึงราคาจริงจาก Yahoo API
    const enriched = await Promise.all(
      visionaryStocks.map(async (s) => {
        try {
          const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}`);
          const j = await r.json();
          const meta = j.chart.result?.[0]?.meta || {};
          return {
            ...s,
            price: meta.regularMarketPrice || meta.previousClose || 0,
            signal: meta.regularMarketPrice > meta.previousClose ? "Buy" : "Hold",
          };
        } catch {
          return s;
        }
      })
    );

    res.status(200).json({
      type: "AI Discovery",
      timestamp: Date.now(),
      stocks: enriched,
      total: enriched.length,
    });
  } catch (err) {
    console.error("⚠️ AI Discovery Error:", err);
    res.status(500).json({ error: "AI discovery failed", details: err.message });
  }
      }
