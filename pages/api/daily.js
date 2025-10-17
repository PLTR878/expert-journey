// ✅ /pages/api/daily.js — AI Stock Analyzer Ultimate Infinity Final Form 🧠💎
import { ema, rsi, macd, atr } from "../../lib/indicators.js";

export default async function handler(req, res) {
  const { symbol, range = "6mo", interval = "1d" } = req.query;

  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const r = await fetch(url);
    const j = await r.json();
    const data = j?.chart?.result?.[0];
    if (!data) throw new Error("No data for symbol");

    const q = data.indicators?.quote?.[0];
    const c = q?.close?.filter(Boolean) || [];
    const h = q?.high?.filter(Boolean) || [];
    const l = q?.low?.filter(Boolean) || [];
    if (c.length < 50) {
      return res.status(200).json({
        symbol,
        message: "ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์",
      });
    }

    // 📊 คำนวณข้อมูลหลัก
    const lastClose = c.at(-1);
    const ema20 = ema(c, 20).at(-1);
    const ema50 = ema(c, 50).at(-1);
    const ema200 = ema(c, 200).at(-1);
    const R = rsi(c, 14).at(-1);
    const M = macd(c, 12, 26, 9);
    const ATR = atr(h, l, c, 14).at(-1);

    const macdLine = M.line.at(-1);
    const macdSignal = M.signal.at(-1);
    const macdHist = M.hist.at(-1);

    // 🔍 Trend Analysis
    let trend =
      ema20 > ema50 && ema50 > ema200
        ? "Strong Uptrend"
        : ema20 < ema50 && ema50 < ema200
        ? "Strong Downtrend"
        : "Sideway";

    // 🧠 AI Signal Logic
    let aiSignal = "Hold";
    if (R < 35 && macdHist > 0) aiSignal = "Buy";
    else if (R > 65 && macdHist < 0) aiSignal = "Sell";

    // 🎯 Confidence + Entry Zone
    const confidence = Math.min(1, Math.abs(R - 50) / 50);
    let entryZone = "Waiting Zone";
    if (aiSignal === "Buy" && ema20 > ema50) entryZone = "Early Entry";
    else if (aiSignal === "Sell" && ema20 < ema50) entryZone = "Exit Zone";
    else if (trend.includes("Strong Uptrend")) entryZone = "Holding Zone";

    // 💎 AI Target Price (แบบชาญฉลาด)
    const targetPrice =
      aiSignal === "Buy"
        ? lastClose * (1 + confidence * 0.08)
        : aiSignal === "Sell"
        ? lastClose * (1 - confidence * 0.06)
        : lastClose;

    // 🌈 Confidence Color Map
    const confPercent = Math.round(confidence * 100);
    const confColor =
      confPercent >= 70
        ? "#00ff95"
        : confPercent >= 50
        ? "#f9d65c"
        : "#ff5577";

    // ✅ ส่งออกครบทุก field (เข้ากันได้กับระบบเดิม)
    res.status(200).json({
      symbol,
      lastClose,
      ema20,
      ema50,
      ema200,
      rsi: R,
      macd: {
        line: macdLine,
        signal: macdSignal,
        hist: macdHist,
      },
      atr14: ATR,
      trend,
      signal: aiSignal,
      confidence,
      confidencePercent: confPercent,
      confidenceColor: confColor,
      targetPrice: Number(targetPrice.toFixed(2)),
      entryZone,
      updated: new Date().toISOString(),
      status: "Realtime",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      symbol,
      lastClose: "-",
      signal: "Hold",
      confidence: 0.5,
      message: "เกิดข้อผิดพลาดในการวิเคราะห์",
    });
  }
        }
