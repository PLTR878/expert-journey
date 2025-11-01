// ✅ OptionX Analyzer API — v∞.1 (Stable + Real Option AI)
export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
    const r = await fetch(url);
    const j = await r.json();
    const chain = j?.optionChain?.result?.[0];
    if (!chain) throw new Error("No option data found");

    const spot = chain.quote?.regularMarketPrice || 0;
    const options = chain.options?.[0] || {};
    const calls = options.calls || [];
    const puts = options.puts || [];

    // === AI Filter ===
    const analyze = (arr, type) => {
      const filtered = arr
        .map((o) => {
          const strike = o.strike?.toFixed(2);
          const last = o.lastPrice || 0;
          const breakeven =
            type === "CALL" ? (strike * 1 + last) : (strike * 1 - last);
          const roi =
            type === "CALL"
              ? ((breakeven - spot) / last) * 100
              : ((spot - breakeven) / last) * 100;
          const itm =
            type === "CALL" ? spot > strike : spot < strike;
          const score =
            (itm ? 20 : 0) +
            (roi > 50 ? 30 : roi > 20 ? 15 : 0) +
            (last < 1 ? 10 : 0);
          return {
            strike,
            last,
            breakeven: breakeven.toFixed(2),
            roi: Math.round(roi),
            itm,
            score,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return filtered;
    };

    const bestCalls = analyze(calls, "CALL");
    const bestPuts = analyze(puts, "PUT");

    const topCall = bestCalls[0];
    const topPut = bestPuts[0];

    // === AI Decision ===
    let signal = "Hold";
    let reason = "Neutral Market";
    if (topCall?.roi > 40 && topCall?.itm) {
      signal = "Buy Call";
      reason = "AI expects upside momentum";
    } else if (topPut?.roi > 40 && topPut?.itm) {
      signal = "Buy Put";
      reason = "AI expects downside momentum";
    }

    res.status(200).json({
      symbol,
      price: spot,
      topCall,
      topPut,
      signal,
      reason,
      calls: bestCalls,
      puts: bestPuts,
      source: "OptionX Analyzer v∞.1 — Yahoo Finance",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
