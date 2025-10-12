// /pages/api/screener.js
export default async function handler(req, res) {
  const { horizon = "short", universe } = req.body || {};

  // 🔹 รายชื่อหุ้นเริ่มต้น
  const tickers =
    universe && universe.length
      ? universe
      : ["AAPL", "NVDA", "INTC", "PLTR", "MSFT", "GOOGL", "META", "AMZN"];

  try {
    const results = await Promise.all(
      tickers.map(async (symbol) => {
        try {
          // ✅ ดึงข้อมูลราคาจริง
          const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
          const quoteRes = await fetch(quoteUrl);
          const quoteData = await quoteRes.json();
          const q = quoteData.quoteResponse.result[0];

          const price =
            q.regularMarketPrice ??
            q.postMarketPrice ??
            q.preMarketPrice ??
            q.previousClose ??
            null;

          const changePct =
            q.regularMarketChangePercent ??
            q.postMarketChangePercent ??
            q.preMarketChangePercent ??
            0;

          const rsi = Math.floor(Math.random() * 40) + 30;
          const e20 = price * (1 + (Math.random() - 0.5) / 30);
          const e50 = price * (1 + (Math.random() - 0.5) / 40);
          const e200 = price * (1 + (Math.random() - 0.5) / 50);
          const signal = rsi > 65 ? "Sell" : rsi < 40 ? "Buy" : "Hold";
          const conf = Math.random();

          return {
            symbol,
            score: rsi / 25,
            lastClose: price,
            rsi,
            e20,
            e50,
            e200,
            signal,
            conf,
          };
        } catch {
          return null;
        }
      })
    );

    res.status(200).json({
      horizon,
      results: results.filter(Boolean),
    });
  } catch (error) {
    console.error("❌ Screener error:", error);
    res.status(500).json({ error: "Failed to run screener" });
  }
              }
