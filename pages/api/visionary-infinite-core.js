// ✅ /pages/api/visionary-infinite-core.js
export default async function handler(req, res) {
  try {
    const { symbol = "NVDA" } = req.query;
    const s = symbol.toUpperCase();

    // === ดึงข้อมูลจาก Yahoo ===
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=6mo&interval=1d`;
    const data = await fetch(url).then(r => r.json());
    const chart = data.chart?.result?.[0];
    if (!chart) throw new Error("Symbol not found");

    const meta = chart.meta;
    const quote = chart.indicators?.quote?.[0];
    const timestamps = chart.timestamp.map(t => t * 1000);
    const prices = quote.close;
    const open = quote.open;
    const high = quote.high;
    const low = quote.low;
    const volume = quote.volume;

    // === คำนวณ EMA ===
    const ema = (arr, p) => {
      const k = 2 / (p + 1);
      return arr.reduce((acc, val, i) => {
        acc.push(i === 0 ? val : val * k + acc[i - 1] * (1 - k));
        return acc;
      }, []);
    };
    const ema20 = ema(prices, 20).at(-1);
    const ema50 = ema(prices, 50).at(-1);
    const ema200 = ema(prices, 200).at(-1);

    // === RSI ===
    const gains = [], losses = [];
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }
    const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    const lastClose = prices.at(-1);
    const trend =
      lastClose > ema20 && ema20 > ema50 ? "Uptrend" :
      lastClose < ema50 && ema50 < ema200 ? "Downtrend" : "Sideway";

    const score = Math.round((rsi / 100) * 40 + (trend === "Uptrend" ? 30 : trend === "Sideway" ? 20 : 10));
    const signal = score > 60 ? "Buy" : score < 40 ? "Sell" : "Hold";

    // === ข่าวล่าสุด ===
    const newsRes = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${s}`);
    const newsData = await newsRes.json();
    const news = newsData.news?.slice(0, 5)?.map(n => ({
      title: n.title,
      link: n.link,
      publisher: n.publisher,
    })) || [];

    // === ส่งข้อมูลทั้งหมดกลับไป ===
    res.status(200).json({
      symbol: s,
      lastClose,
      ema20,
      ema50,
      ema200,
      rsi: Number(rsi.toFixed(2)),
      trend,
      aiScore: score,
      signal,
      confidence: Math.min(100, Math.abs(score - 50) * 2),
      reason:
        trend === "Uptrend"
          ? "แนวโน้มขาขึ้นแข็งแรง"
          : trend === "Downtrend"
          ? "แรงขายกดดันตลาด"
          : "ตลาดทรงตัวในกรอบ",
      chart: {
        timestamps,
        prices,
        open,
        high,
        low,
        volume,
      },
      news,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
                                             }
