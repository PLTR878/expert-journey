// ✅ /lib/aiAnalyzer.js — Visionary Analyzer Engine (V∞.Full)
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
    const pct = prev ? (change / prev) * 100 : 0;

    let aiScore = 50;
    const up = change > 0;
    const strongUp = pct > 3;
    const strongDown = pct < -3;

    // ✅ แนวโน้มราคาสั้น
    if (strongUp) aiScore += 20;
    else if (up) aiScore += 10;
    else if (strongDown) aiScore -= 10;

    // ✅ หุ้นเทคโนโลยี / AI / พลังงานใหม่ ให้โบนัสเพิ่ม
    const sym = symbol.toUpperCase();
    if (/(AI|PLTR|NVDA|TSLA|SLDP|NRGV|GWH|OKLO|RXRX|IONQ)/.test(sym))
      aiScore += 10;

    // ✅ ความผันผวนแรง (แสดงโมเมนตัม)
    if (Math.abs(pct) > 5) aiScore += 5;

    // ✅ หุ้นในตลาดหลัก NMS = NASDAQ ให้เพิ่มอีก
    if (meta.exchangeName?.includes("NMS")) aiScore += 3;

    // ✅ สร้างคำอธิบายผล
    let reason = "ราคาทรงตัวในโซนสะสม";
    if (aiScore > 85) reason = "AI พบแนวโน้มขาขึ้นชัดเจน";
    else if (aiScore > 70) reason = "โมเมนตัมเริ่มเป็นบวก";
    else if (aiScore < 50) reason = "แรงขายเริ่มมากขึ้น";

    const trend =
      aiScore > 80 ? "Uptrend" : aiScore < 60 ? "Downtrend" : "Sideway";
    const signal =
      trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";

    return {
      symbol,
      price,
      change: Number(change.toFixed(2)),
      pct: Number(pct.toFixed(2)),
      aiScore: Math.round(aiScore),
      trend,
      signal,
      reason,
    };
  } catch {
    return null;
  }
}
