// ✅ /pages/api/price.js — Improved & Stable Version
export default async function handler(req, res) {
  try {
    const symbol = String(req.query.symbol || "").toUpperCase();
    if (!symbol) return res.status(400).json({ error: "symbol required" });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Yahoo fetch failed: ${r.status}`);
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) throw new Error("No chart result");

    const closes = (result?.indicators?.quote?.[0]?.close || []).filter(x => x != null);
    const price = result?.meta?.regularMarketPrice ?? closes.at(-1) ?? null;

    // RSI 14 calculation
    const computeRSI14 = (cl) => {
      const n = 14;
      if (!cl || cl.length <= n) return null;
      let gains = 0, losses = 0;
      for (let i = 1; i <= n; i++) {
        const diff = cl[i] - cl[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }
      let avgGain = gains / n, avgLoss = losses / n;
      for (let i = n + 1; i < cl.length; i++) {
        const diff = cl[i] - cl[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (n - 1) + gain) / n;
        avgLoss = (avgLoss * (n - 1) + loss) / n;
      }
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - 100 / (1 + rs);
    };

    const rsi = computeRSI14(closes);
    let signal = "Neutral";
    if (rsi != null) {
      if (rsi >= 65) signal = "Buy";
      else if (rsi <= 35) signal = "Sell";
      else signal = "Hold";
    }

    return res.status(200).json({ symbol, price, rsi: Number(rsi?.toFixed(2)), signal });
  } catch (e) {
    console.error("Price API error:", e.message);
    res.status(200).json({ error: e.message, price: null, rsi: null, signal: "Neutral" });
  }
}
