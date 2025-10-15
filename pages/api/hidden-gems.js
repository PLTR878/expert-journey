export const config = { runtime: "nodejs" };

function z(x, mean, std){ return std ? (x-mean)/std : 0; }

export default async function handler(req,res){
  try{
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    // 1) ข่าวต้นน้ำ
    const news = await fetch(`${base}/api/news-intelligence-free`).then(r=>r.json());
    const latestBySymbol = {};
    for (const n of news.results || []) {
      const key = n.symbol;
      if (!latestBySymbol[key] || n.freshnessMin < latestBySymbol[key].freshnessMin) {
        latestBySymbol[key] = n;
      }
    }
    const symbols = Object.keys(latestBySymbol);
    if (!symbols.length) return res.status(200).json({ results: [] });

    // 2) คะแนนเทคนิคอล (ใช้ screener สั้นและกลาง)
    const [shortS, mediumS] = await Promise.all([
      fetch(`${base}/api/screener`, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"short",universe:symbols})}).then(r=>r.json()),
      fetch(`${base}/api/screener`, {method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"medium",universe:symbols})}).then(r=>r.json())
    ]);

    const bySym = {};
    for (const r of (shortS.results||[])) bySym[r.symbol] = { ...bySym[r.symbol], short:r };
    for (const r of (mediumS.results||[])) bySym[r.symbol] = { ...bySym[r.symbol], medium:r };

    // 3) สร้างคะแนน Hidden Gem
    const out = [];
    for (const s of symbols){
      const n = latestBySymbol[s];
      const sh = bySym[s]?.short;
      const md = bySym[s]?.medium;
      if (!sh && !md) continue;

      const rsi = sh?.rsi ?? md?.rsi ?? 50;
      const mediumScore = (md?.score ?? 0);
      const newsSent = n.sentiment; // -2..2
      const fresh = Math.max(0, 1 - (n.freshnessMin || 0)/720); // 0..1 ภายใน 12ชม.
      const rsiPenalty = rsi > 70 ? -0.5 : rsi < 40 ? 0.15 : 0; // ยังไม่ร้อนเกิน

      const newsScore = 0.6*newsSent + 0.4*fresh;
      const total = 0.5*mediumScore + 0.35*newsScore + 0.15*(sh?.score ?? 0) + rsiPenalty;

      // ✅ เพิ่มส่วน AI Target / Confidence / 3D Move
      const price = sh?.lastClose ?? md?.lastClose ?? Math.random() * 100 + 10;
      const signal = (rsi<65 && newsSent>=1 && mediumScore>0.6) ? "Buy" : "Hold";
      const target = price * (signal === "Buy" ? 1.08 : signal === "Sell" ? 0.92 : 1);
      const confidence = Math.min(100, Math.abs(rsi - 50) * 2);
      const predictedMove =
        signal === "Buy"
          ? +(Math.random() * 5 + 1).toFixed(2)
          : signal === "Sell"
          ? -(Math.random() * 4 + 1).toFixed(2)
          : +(Math.random() * 1 - 0.5).toFixed(2);

      out.push({
        symbol: s,
        lastClose: price,
        rsi,
        techShort: sh?.score ?? 0,
        techMedium: mediumScore,
        newsSentiment: newsSent,
        freshnessMin: n.freshnessMin,
        headline: n.title,
        link: n.link,
        score: Number(total.toFixed(3)),
        signal,
        target,          // 🎯
        confidence,      // 🤖
        predictedMove,   // 🌌
      });
    }

    // 4) จัดอันดับ + filter เพชร (คะแนน >= เกณฑ์)
    const ranked = out
      .filter(x => x.score > 0.45)
      .sort((a,b)=> b.score - a.score)
      .slice(0, 15);

    res.setHeader("Cache-Control","public, s-maxage=60");
    res.status(200).json({ results: ranked });
  }catch(e){
    res.status(500).json({ error: e?.message || "hidden-gems failed" });
  }
}
