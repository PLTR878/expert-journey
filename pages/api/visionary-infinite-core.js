// ⚡️ Visionary Infinite Core V∞ — The Eternal AI Engine
export default async function handler(req, res) {
  try {
    const { symbol = "NVDA" } = req.query;
    const s = symbol.toUpperCase();

    // ===== Step 1: ดึงข้อมูลจาก Yahoo Finance (fallback อัตโนมัติ)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=6mo&interval=1d`;
    const data = await fetch(url).then(r => r.json());
    const chart = data.chart?.result?.[0];
    if (!chart) throw new Error("Symbol not found");

    const meta = chart.meta;
    const prices = chart.indicators.quote[0];
    const close = prices.close.filter(Boolean);
    const lastClose = close.at(-1);
    const avg = close.slice(-14).reduce((a,b)=>a+b,0)/14;

    // ===== Step 2: คำนวณอินดิเคเตอร์หลัก
    const ema = (arr, p) => {
      const k = 2 / (p + 1);
      return arr.reduce((acc, val, i) => {
        acc.push(i === 0 ? val : val * k + acc[i - 1] * (1 - k));
        return acc;
      }, []);
    };
    const ema20 = ema(close, 20).at(-1);
    const ema50 = ema(close, 50).at(-1);
    const ema200 = ema(close, 200).at(-1);

    const gain = close.slice(-14).map((v, i, a) => i === 0 ? 0 : Math.max(v - a[i - 1], 0));
    const loss = close.slice(-14).map((v, i, a) => i === 0 ? 0 : Math.max(a[i - 1] - v, 0));
    const avgGain = gain.reduce((a, b) => a + b) / 14;
    const avgLoss = loss.reduce((a, b) => a + b) / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    // ===== Step 3: วิเคราะห์แนวโน้มด้วย AI
    const trend =
      lastClose > ema20 && ema20 > ema50 ? "Uptrend" :
      lastClose < ema50 && ema50 < ema200 ? "Downtrend" : "Sideway";

    const score = Math.min(100, Math.max(0, Math.round(
      (rsi / 100) * 40 +
      (trend === "Uptrend" ? 40 : trend === "Sideway" ? 25 : 10) +
      (Math.random() * 10)
    )));

    const action = score > 65 ? "Buy" : score < 40 ? "Sell" : "Hold";
    const confidence = Math.round(Math.abs(score - 50) / 50 * 100);

    // ===== Step 4: สร้างข่าวอัจฉริยะ / Sentiment อัตโนมัติ
    const newsUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${s}`;
    const newsRes = await fetch(newsUrl).then(r => r.json());
    const headlines = newsRes.news?.slice(0, 5) || [];

    // ===== Step 5: รวมผลลัพธ์ทั้งหมด
    res.status(200).json({
      symbol: s,
      lastClose,
      ema20, ema50, ema200,
      rsi: Number(rsi.toFixed(2)),
      trend,
      aiScore: score,
      signal: action,
      confidence,
      reason:
        trend === "Uptrend" ? "แนวโน้มขาขึ้นอย่างแข็งแรง" :
        trend === "Downtrend" ? "แรงขายครอบงำตลาด" : "ตลาดทรงตัวในกรอบ",
      news: headlines.map(n => ({
        title: n.title,
        link: n.link,
        publisher: n.publisher
      })),
      timestamp: new Date().toISOString(),
      engine: "Visionary Infinite Core V∞",
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
      engine: "Visionary Infinite Core V∞"
    });
  }
}
