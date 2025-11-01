// /pages/api/optionx-analyzer.js
export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v7/finance/options/${symbol}`);
    const j = await r.json();
    const chain = j?.optionChain?.result?.[0];
    if (!chain) throw new Error("No option data");
    const spot = chain.quote?.regularMarketPrice ?? 0;
    const { calls = [], puts = [] } = chain.options?.[0] || {};

    const pick = (arr, type) =>
      arr.map(o => {
         const strike = o.strike, last = o.lastPrice ?? 0;
         const be = type==="CALL" ? strike + last : strike - last;
         const roi = type==="CALL" ? ((be - spot)/Math.max(0.01,last))*100
                                   : ((spot - be)/Math.max(0.01,last))*100;
         const itm = type==="CALL" ? spot>strike : spot<strike;
         const score = (itm?25:0) + (roi>50?25:roi>20?15:0) + (last<1?10:0);
         return { strike, last:+last.toFixed(2), roi:Math.round(roi), itm, score };
      }).sort((a,b)=>b.score-a.score).slice(0,5);

    res.status(200).json({ symbol, price:+spot.toFixed(2),
      calls: pick(calls,"CALL"), puts: pick(puts,"PUT"), source:"OptionX v∞" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
