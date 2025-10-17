// ✅ pages/api/fullscan.js
// สแกนหุ้นทั้งตลาดอเมริกาฟรีผ่าน Yahoo Finance API แบบ batch
import { ema, rsi, macd } from "../../lib/indicators.js";

// รายชื่อหุ้นตัวอย่าง (คุณสามารถขยายได้ภายหลัง)
const STOCK_LIST = [
  "AAPL","MSFT","NVDA","TSLA","AMZN","GOOG","META","PLTR","AMD","NFLX",
  "INTC","SHOP","SQ","RBLX","CRWD","NET","SMCI","SOFI","F","NIO",
  "SLDP","NRGV","GWH","CHPT","BEEM","ENPH","RUN","SPWR","TTD","ZM"
]; // เริ่มจาก 30 ตัวทดสอบก่อน (ฟรี + เร็ว)

export default async function handler(req, res) {
  try {
    const { mode = "short" } = req.query;
    const results = [];

    for (let symbol of STOCK_LIST) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();

      const data = j?.chart?.result?.[0];
      if (!data?.indicators?.quote?.[0]?.close) continue;

      const c = data.indicators.quote[0].close.filter(Boolean);
      const hi = data.indicators.quote[0].high.filter(Boolean);
      const lo = data.indicators.quote[0].low.filter(Boolean);
      if (c.length < 50) continue;

      const lastPrice = c.at(-1);
      const ema20 = ema(c, 20).at(-1);
      const ema50 = ema(c, 50).at(-1);
      const ema200 = ema(c, 200).at(-1);
      const R = rsi(c, 14).at(-1);
      const M = macd(c, 12, 26, 9);

      const hist = M.hist.at(-1);
      const signal = M.signal.at(-1);
      const macdLine = M.line.at(-1);

      let buy = false;
      if (mode === "short") {
        buy = ema20 > ema50 && R > 40 && R < 70 && hist > 0;
      } else if (mode === "swing") {
        buy = ema20 > ema50 && ema50 > ema200 && R >= 45 && R <= 70;
      } else if (mode === "long") {
        buy = ema50 > ema200 && R > 50 && lastPrice > ema200;
      }

      results.push({
        symbol,
        price: lastPrice,
        ema20,
        ema50,
        ema200,
        rsi: R,
        macd: { hist, signal, macdLine },
        signal: buy ? "BUY" : "WAIT",
      });
    }

    const filtered = results.filter((r) => r.signal === "BUY");
    res.status(200).json({ total: results.length, matches: filtered.length, results: filtered });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
                 }
