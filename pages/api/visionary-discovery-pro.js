// ✅ Visionary Discovery Pro (Lite + Memory Edition)
// จำหุ้น 30 ตัวล่าสุด + อัปเดตเฉพาะตัวที่ดีกว่า
// ใช้กับ cron-job.org ได้จริง ไม่พัง ไม่ timeout

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const BATCH_SIZE = 10;
    const STORAGE_PATH = path.join(process.cwd(), "public", "ai-portfolio.json");

    // ===== โหลดรายชื่อหุ้นทั้งหมด (~7,000 ตัว) =====
    const stockSources = [
      "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
      "https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv",
      "https://datahub.io/core/amex-listings/r/amex-listed.csv",
    ];

    let allSymbols = [];
    for (const src of stockSources) {
      try {
        const raw = await fetch(src).then((r) => r.text());
        const list = raw
          .split("\n")
          .map((l) => l.split(",")[0].trim())
          .filter((s) => /^[A-Z.]+$/.test(s));
        allSymbols.push(...list);
      } catch {}
    }

    allSymbols = [...new Set(allSymbols)].slice(0, 7000);
    const sample = allSymbols.sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE);

    // ===== ฟังก์ชันคำนวณ =====
    const EMA = (arr, p) => {
      if (!arr?.length) return null;
      const k = 2 / (p + 1);
      let e = arr[0];
      for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
      return e;
    };

    const RSI = (arr, n = 14) => {
      if (!arr || arr.length < n + 1) return 50;
      let g = 0, l = 0;
      for (let i = 1; i <= n; i++) {
        const d = arr[i] - arr[i - 1];
        if (d >= 0) g += d;
        else l -= d;
      }
      const rs = g / (l || 1);
      return 100 - 100 / (1 + rs);
    };

    const newsSentiment = async (sym) => {
      try {
        const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
        const j = await r.json();
        const items = (j.news || []).slice(0, 5);
        let score = 0;
        for (const n of items) {
          const t = `${n.title || ""} ${n.summary || ""}`.toLowerCase();
          if (/(ai|growth|record|expand|beat|contract|partnership|upgrade)/.test(t)) score += 2;
          if (/(fraud|lawsuit|miss|cut|layoff|downgrade|probe|decline)/.test(t)) score -= 2;
        }
        return score;
      } catch {
        return 0;
      }
    };

    const getChart = async (sym) => {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`
        );
        const j = await r.json();
        return j.chart?.result?.[0];
      } catch {
        return null;
      }
    };

    // ===== โหลดพอร์ตเดิม (ถ้ามี) =====
    let oldPortfolio = [];
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        oldPortfolio = JSON.parse(fs.readFileSync(STORAGE_PATH, "utf8") || "[]");
      }
    } catch {
      oldPortfolio = [];
    }

    const results = [];

    // ===== เริ่มสแกน =====
    for (const sym of sample) {
      try {
        const d = await getChart(sym);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        if (!closes?.length) continue;

        const last = closes.at(-1);
        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const rsi = RSI(closes);
        const sentiment = await newsSentiment(sym);

        if (last > 35) continue;
        if (ema20 <= ema50) continue;
        if (rsi < 45 || rsi > 75) continue;
        if (sentiment <= 0) continue;

        const aiScore = Math.round((rsi - 45) * 2 + sentiment * 5);

        results.push({
          symbol: sym,
          price: Number(last.toFixed(2)),
          ema20: Number(ema20.toFixed(2)),
          ema50: Number(ema50.toFixed(2)),
          rsi: Math.round(rsi),
          sentiment,
          aiScore,
          reason: "AI พบแนวโน้มต้นน้ำ + ข่าวบวกต่อเนื่อง",
          updated: new Date().toISOString(),
        });
      } catch {}
      await new Promise((r) => setTimeout(r, 30));
    }

    // ===== รวมพอร์ตเดิม + ใหม่ (เลือกตัวที่ aiScore สูงกว่า) =====
    const combined = [...oldPortfolio, ...results];
    const unique = combined.reduce((acc, cur) => {
      const exist = acc.find((x) => x.symbol === cur.symbol);
      if (!exist) acc.push(cur);
      else if (cur.aiScore > exist.aiScore) {
        const idx = acc.findIndex((x) => x.symbol === cur.symbol);
        acc[idx] = cur;
      }
      return acc;
    }, []);

    // ===== Top 30 หุ้นที่ดีที่สุด =====
    const top30 = unique.sort((a, b) => b.aiScore - a.aiScore).slice(0, 30);

    // ===== บันทึกพอร์ตถาวร =====
    try {
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(top30, null, 2));
    } catch (err) {
      console.warn("⚠️ เขียนไฟล์ไม่สำเร็จ:", err.message);
    }

    // ===== ส่งผลลัพธ์กลับ =====
    res.status(200).json({
      success: true,
      total: allSymbols.length,
      scanned: sample.length,
      discovered: top30,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
          }
