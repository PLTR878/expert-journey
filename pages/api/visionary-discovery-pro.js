// ✅ visionary-discovery-pro.js — Visionary AI Discovery Pro (Full System)
import stockList from "../../lib/stocklist";
import { analyzeStock } from "../../lib/aiAnalyzer";

export default async function handler(req, res) {
  try {
    const limit = 7000;
    const selected = stockList.slice(0, limit);
    const results = [];

    console.time("AI Discovery Scan");

    for (const sym of selected) {
      const r = await analyzeStock(sym);
      if (r && r.aiScore > 70) results.push(r);
    }

    console.timeEnd("AI Discovery Scan");

    const top50 = results.sort((a, b) => b.aiScore - a.aiScore).slice(0, 50);

    res.status(200).json({
      discovered: top50,
      totalScanned: selected.length,
      found: top50.length,
      time: new Date().toLocaleString("th-TH"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
