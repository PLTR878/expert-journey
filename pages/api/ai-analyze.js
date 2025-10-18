const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://expert-journey-ten.vercel.app";
// ✅ /pages/api/ai-analyze.js — AI Stock Analyzer (Stable)
import { ema, rsi, macd, atr } from "../../lib/indicators.js";

export default async function handler(req, res) {
  const { symbol, range = "6mo", interval = "1d" } = req.query;
  if (!symbol)
    return res.status(400).json({ error: "Missing symbol parameter" });

  try {
    // 🧠 ป้องกัน rate-limit
    await new Promise((r) => setTimeout(r, 700));

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (AIStockBot/2.0)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const j = await r.json();
    const data = j?.chart?.result?.[0];
    if (!data) throw new Error("No data for symbol");

    const q = data.indicators?.quote?.[0];
    const c = q?.close?.filter(Boolean) || [];
    const h = q?.high?.filter(Boolean) || [];
    const l = q?.low?.filter(Boolean) || [];

    if (c.length < 30)
      return res.status(200).json({
        symbol,
        message: "ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์",
        signal: "Hold",
        confidence: 0.5,
        confidencePercent: 50,
      });

    // 🔹 Indicators
    const lastClose = c[c.length - 1];
    const ema20 = ema(c, 20).slice(-1)[0];
    const ema50 = ema(c, 50).slice(-1)[0];
    const ema200 = ema(c, 200).slice(-1)[0];
    const R = rsi(c, 14).slice(-1)[0];
    const M = macd(c, 12, 26, 9);
    const ATR = atr(h, l, c, 14).slice(-1)[0];
    const macdLine = M.line.slice(-1)[0];
    const macdSignal = M.signal.slice(-1)[0];
    const macdHist = M.hist.slice(-1)[0];

    // 🔹 AI Logic
    let trend =
      ema20 > ema50 && ema50 > ema200
        ? "Strong Uptrend"
        : ema20 < ema50 && ema50 < ema200
        ? "Strong Downtrend"
        : "Sideway";

    let aiSignal = "Hold";
    if (R < 35 && macdHist > 0) aiSignal = "Buy";
    else if (R > 65 && macdHist < 0) aiSignal = "Sell";

    const confidence = Math.min(1, Math.abs(R - 50) / 50);
    const confPercent = Math.round(confidence * 100);
    const confColor =
      confPercent >= 70 ? "#00ff95" : confPercent >= 50 ? "#f9d65c" : "#ff5577";

    const entryZone =
      aiSignal === "Buy"
        ? ema20 > ema50
          ? "Early Entry"
          : "Wait for Breakout"
        : aiSignal === "Sell"
        ? "Exit Zone"
        : "Holding Zone";

    const targetPrice =
      aiSignal === "Buy"
        ? lastClose * (1 + confidence * 0.08)
        : aiSignal === "Sell"
        ? lastClose * (1 - confidence * 0.06)
        : lastClose;

    // ✅ ส่งผลลัพธ์กลับ
    res.status(200).json({
      symbol,
      lastClose,
      ema20,
      ema50,
      ema200,
      rsi: R,
      macd: { line: macdLine, signal: macdSignal, hist: macdHist },
      atr14: ATR,
      trend,
      signal: aiSignal,
      confidence,
      confidencePercent: confPercent,
      confidenceColor: confColor,
      targetPrice: Number(targetPrice.toFixed(2)),
      entryZone,
      updated: new Date().toISOString(),
      status: "AI-Analyze-OK",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      symbol,
      signal: "Hold",
      confidence: 0.5,
      message: "เกิดข้อผิดพลาดในการวิเคราะห์",
    });
  }
      }
