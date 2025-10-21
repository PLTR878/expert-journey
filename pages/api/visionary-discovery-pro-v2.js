// ✅ Visionary Discovery Pro v2 — Stable Intelligent Selection (Fixed for UI V∞.28)
// รองรับหน้าเว็บ Visionary Stock Screener ทุกเวอร์ชัน / ปลอดภัยต่อ Vercel

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const storagePath = path.join(process.cwd(), "public", "visionary-storage.json");
  const BATCH_SIZE = 300;

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
    let g = 0,
      l = 0;
    for (let i = 1; i <= n; i++) {
      const d = arr[i] - arr[i - 1];
      if (d >= 0) g += d;
      else l -= d;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  // ===== ดึงข้อมูลกราฟ =====
  const fetchChart = async (sym) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      return j?.chart?.result?.[0] || null;
    } catch {
      return null;
    }
  };

  // ===== วิเคราะห์ข่าว =====
  const newsScore = async (sym) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
      const j = await r.json();
      const items = (j.news || []).slice(0, 8);
      let score = 0;
      for (const n of items) {
        const t = `${n.title || ""} ${n.summary || ""}`.toLowerCase();
        if (/(ai|partnership|contract|expand|award|growth|record|innovation|approval)/.test(t))
          score += 3;
        if (/(fraud|lawsuit|decline|miss|cut|layoff|probe|downgrade)/.test(t))
          score -= 3;
      }
      return score;
    } catch {
      return 0;
    }
  };

  try {
    // ===== 1️⃣ โหลดรายชื่อหุ้นตลาด =====
    const listURL = "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv";
    const csv = await fetch(listURL).then((r) => r.text());
    const allSymbols = csv
      .split("\n")
      .map((l) => l.split(",")[0])
      .filter((s) => /^[A-Z.]+$/.test(s))
      .slice(0, 7000);

    // ===== 2️⃣ โหลดข้อมูลเก่า (ถ้ามี) =====
    let storage = [];
    try {
      if (fs.existsSync(storagePath)) {
        storage = JSON.parse(fs.readFileSync(storagePath, "utf8") || "[]");
      }
    } catch {
      storage = [];
    }

    const candidates = [];

    // ===== 3️⃣ สแกนหุ้นแบบสุ่ม 300 ตัว =====
    const sample = allSymbols.sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE);

    for (const sym of sample) {
      try {
        const data = await fetchChart(sym);
        const q = data?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        if (!closes?.length) continue;

        const last = closes.at(-1);
        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const rsi = RSI(closes);
        const sentiment = await newsScore(sym);

        // ===== 4️⃣ เงื่อนไขคัดหุ้นต้นน้ำ =====
        if (last > 35 || rsi < 50 || sentiment <= 0 || ema20 < ema50) continue;

        const aiScore =
          (rsi - 40) * 1.5 +
          sentiment * 10 +
          (ema20 > ema50 ? 10 : 0) +
          (last < 25 ? 5 : 0);

        candidates.push({
          symbol: sym,
          price: Number(last.toFixed(2)),
          rsi: Math.round(rsi),
          sentiment,
          aiScore: Math.round(aiScore),
          reason: "AI พบแนวโน้มต้นน้ำชัดเจน + ข่าวเชิงบวก",
        });
      } catch {}
    }

    // ===== 5️⃣ รวมข้อมูลเก่า + ใหม่ =====
    const combined = [...storage, ...candidates];
    const unique = combined.reduce((acc, cur) => {
      if (!acc.find((x) => x.symbol === cur.symbol)) acc.push(cur);
      return acc;
    }, []);

    const top = unique.sort((a, b) => b.aiScore - a.aiScore).slice(0, 30);

    // ===== 6️⃣ เขียนไฟล์เก็บผล (ถ้าเขียนได้)
    try {
      fs.writeFileSync(storagePath, JSON.stringify(top, null, 2));
    } catch {
      // ถ้าไม่มีสิทธิ์เขียนไฟล์ (เช่นใน Vercel) ก็ข้าม
    }

    // ===== 7️⃣ ส่งผลลัพธ์กลับให้ UI (ครบทุก key)
    return res.status(200).json({
      success: true,
      totalScanned: sample.length,
      topCount: top.length,
      discovered: top, // ✅ เพิ่มให้ตรงกับ UI
      top, // ✅ UI รองรับทั้ง discovered / top
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
      }
