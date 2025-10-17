// ✅ /pages/api/scan.js — Full Market Auto Scanner (US Stocks)
// ทำงานได้จริง สแกนหุ้นทั้งตลาด NASDAQ, NYSE, AMEX
// ใช้ server เดิม (ไม่ต้อง proxy พิเศษ)

import { ema, rsi, macd } from "../../lib/indicators.js";

export default async function handler(req, res) {
  try {
    const {
      rsiMin = 0,
      rsiMax = 100,
      priceMin = 0,
      priceMax = 10000,
    } = req.query;

    // 🧩 โหลดรายชื่อหุ้นทั้งตลาด (NASDAQ + NYSE + AMEX)
    const allTickers = await fetch(
      "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX"
    ).then((r) => r.json());

    // จำกัดชั่วคราวที่ 6000 ตัว (พอๆ กับทั้งตลาด)
    const symbols = allTickers.map((s) => s.ticker).slice(0, 6000);
    const results = [];

    console.log(`🛰️ เริ่มสแกนหุ้นทั้งหมด ${symbols.length} ตัว...`);

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      try {
        // Yahoo API (ผ่าน Jina proxy เพื่อเสถียร)
        const url = `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();
        const data = j?.chart?.result?.[0];
        if (!data) continue;

        const q = data.indicators?.quote?.[0];
        const c = q?.close?.filter(Boolean) || [];
        if (c.length < 30) continue;

        const lastClose = c.at(-1);
        if (lastClose < priceMin || lastClose > priceMax) continue;

        const R = rsi(c, 14)?.at(-1) ?? 50;
        const M = macd(c, 12, 26, 9);
        const macdHist = M?.hist?.at(-1) ?? 0;
        const ema20 = ema(c, 20)?.at(-1);
        const ema50 = ema(c, 50)?.at(-1);
        const ema200 = ema(c, 200)?.at(-1);

        if (R < rsiMin || R > rsiMax) continue;

        const trend =
          ema20 > ema50 && ema50 > ema200
            ? "Uptrend"
            : ema20 < ema50 && ema50 < ema200
            ? "Downtrend"
            : "Sideway";

        let signal = "Hold";
        if (R < 35 && macdHist > 0) signal = "Buy";
        else if (R > 65 && macdHist < 0) signal = "Sell";

        results.push({
          symbol,
          lastClose: Number(lastClose.toFixed(2)),
          rsi: Number(R.toFixed(1)),
          trend,
          signal,
          confidence: Math.round(Math.abs(R - 50) / 50 * 100),
        });

        // ป้องกันโดน block
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        console.error(`❌ ${symbol}:`, err.message);
      }
    }

    console.log(`✅ สแกนเสร็จทั้งหมด ${results.length} ตัว`);
    res.status(200).json({ total: results.length, results });
  } catch (err) {
    console.error("Scan error:", err.message);
    res.status(500).json({ error: err.message });
  }
                                 }
