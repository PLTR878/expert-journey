// ✅ /pages/api/scan.js — Stable + Correct Filter
import { ema, rsi, macd } from "../../lib/indicators.js";

export default async function handler(req, res) {
  try {
    const {
      rsiMin = 0,
      rsiMax = 100,
      priceMin = 0,
      priceMax = 10000,
    } = req.query;

    const symbols = ["AAPL", "TSLA", "NVDA", "PLTR", "GWH", "SLDP", "SMCI", "CHPT", "RBLX"];
    const results = [];

    for (const symbol of symbols) {
      try {
        const url = `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
        const r = await fetch(url);
        const j = await r.json();
        const data = j?.chart?.result?.[0];
        if (!data) continue;

        const q = data.indicators?.quote?.[0];
        const c = q?.close?.filter(Boolean) || [];
        if (c.length < 30) continue;

        const lastClose = c.at(-1);
        const R = rsi(c, 14)?.at(-1) ?? 50;
        const M = macd(c, 12, 26, 9);
        const macdHist = M?.hist?.at(-1) ?? 0;
        const ema20 = ema(c, 20)?.at(-1);
        const ema50 = ema(c, 50)?.at(-1);
        const ema200 = ema(c, 200)?.at(-1);

        let signal = "Hold";
        if (R < 35 && macdHist > 0) signal = "Buy";
        else if (R > 65 && macdHist < 0) signal = "Sell";

        const trend =
          ema20 > ema50 && ema50 > ema200
            ? "Uptrend"
            : ema20 < ema50 && ema50 < ema200
            ? "Downtrend"
            : "Sideway";

        // ✅ ใช้ default filter ปลอดภัย
        if (
          lastClose >= priceMin &&
          lastClose <= priceMax &&
          R >= rsiMin &&
          R <= rsiMax
        ) {
          results.push({
            symbol,
            lastClose: Number(lastClose.toFixed(2)),
            rsi: Number(R.toFixed(1)),
            signal,
            trend,
            confidence: Math.round(Math.abs(R - 50) / 50 * 100),
          });
        }

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error("Error:", symbol, err.message);
      }
    }

    res.status(200).json({ total: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
          }
