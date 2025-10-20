// ✅ aiAnalyzer.js
export async function analyzeStock(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const res = await fetch(url);
    const data = await res.json();

    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const prev = meta.previousClose || 0;
    const change = price - prev;
    const pct = prev ? ((change / prev) * 100).toFixed(2) : 0;

    let aiScore = 50;
    const up = change > 0;
    const strongUp = pct > 3;
    const strongDown = pct < -3;

    if (strongUp) aiScore += 20;
    else if (up) aiScore += 10;
    else if (strongDown) aiScore -= 10;

    const highVolatility = Math.abs(pct) > 5;
    if (highVolatility) aiScore += 5;

    if (meta.exchangeName?.includes("NMS")) aiScore += 5;

    const sym = symbol.toUpperCase();
    if (
      ["AI", "PLTR", "NVDA", "TSLA", "SLDP", "NRGV", "GWH", "OKLO"].some((k) =>
        sym.includes(k)
      )
    ) {
      aiScore += 15;
    }

    const trend =
      aiScore > 80
        ? "Uptrend"
        : aiScore < 60
        ? "Downtrend"
        : "Sideway";
    const signal =
      trend === "Uptrend"
        ? "Buy"
        : trend === "Downtrend"
        ? "Sell"
        : "Hold";

    const reason =
      aiScore > 85
        ? "AI พบแนวโน้มขาขึ้นชัดเจน"
        : aiScore > 70
        ? "โมเมนตัมเริ่มเป็นบวก"
        : aiScore < 50
        ? "แรงขายเริ่มมากขึ้น"
        : "ราคาทรงตัวในโซนสะสม";

    return {
      symbol,
      price,
      change,
      pct,
      aiScore: Math.round(aiScore),
      trend,
      signal,
      reason,
    };
  } catch {
    return null;
  }
}
