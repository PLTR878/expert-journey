// ✅ AI Screener Hybrid — Galactic Edition
import { ema, rsi, macd } from "../../lib/indicators.js";

const STOCK_LIST = [
  "AAPL","MSFT","NVDA","TSLA","AMZN","GOOG","META","PLTR","AMD","NFLX","INTC","SHOP","SQ",
  "RBLX","CRWD","NET","SMCI","SOFI","F","NIO","SLDP","NRGV","GWH","CHPT","BEEM","ENPH",
  "RUN","SPWR","TTD","ZM","BBAI","AEHR","TMC","VKTX","RR","BTDR","IREN","GWH","IONQ"
];

export default async function handler(req, res) {
  try {
    const { mode = "short" } = req.query;
    const out = [];

    for (const symbol of STOCK_LIST) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      const data = j?.chart?.result?.[0];
      if (!data) continue;

      const c = data.indicators.quote[0].close.filter(Boolean);
      const h = data.indicators.quote[0].high.filter(Boolean);
      const l = data.indicators.quote[0].low.filter(Boolean);
      if (c.length < 50) continue;

      const last = c.at(-1);
      const e20 = ema(c, 20).at(-1);
      const e50 = ema(c, 50).at(-1);
      const e200 = ema(c, 200).at(-1);
      const R = rsi(c, 14).at(-1);
      const M = macd(c, 12, 26, 9);
      const hist = M.hist.at(-1);

      let signal = "Hold";
      if (mode === "short" && e20 > e50 && R > 45 && R < 65 && hist > 0) signal = "Buy";
      else if (mode === "swing" && e20 > e50 && e50 > e200 && R > 50 && hist > 0) signal = "Buy";
      else if (mode === "long" && e50 > e200 && R > 50 && last > e200) signal = "Buy";

      out.push({
        symbol,
        price: last,
        ema20: e20,
        ema50: e50,
        ema200: e200,
        rsi: R,
        macdHist: hist,
        signal,
        confidence: Math.min(1, Math.abs(R - 50) / 50),
      });
    }

    const filtered = out.filter((x) => x.signal === "Buy");
    res.status(200).json({ mode, total: out.length, results: filtered });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
