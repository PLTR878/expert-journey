// ✅ Visionary Discovery Pro — Intelligent Stable Selection (v3)
// ระบบคัดหุ้นต้นน้ำแท้จริง: เปลี่ยนเฉพาะเมื่อเจอตัวที่ดีกว่าเท่านั้น

export default async function handler(req, res) {
  try {
    const BATCH_SIZE = 10;

    // ===== Memory Cache (เก็บหุ้นล่าสุดไว้ในหน่วยความจำ) =====
    if (!globalThis.visionaryCache) {
      globalThis.visionaryCache = {
        topStocks: [],
        lastUpdate: null,
      };
    }

    // ✅ ดึงรายชื่อหุ้นจาก 3 ตลาดหลัก
    const stockSources = [
      "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
      "https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv",
      "https://datahub.io/core/amex-listings/r/amex-listed.csv",
    ];

    // รวมทั้งหมด (~7,000 ตัว)
    let allSymbols = [];
    for (const src of stockSources) {
      try {
        const raw = await fetch(src).then((r) => r.text());
        const list = raw
          .split("\n")
          .map((l) => l.split(",")[0].trim())
          .filter((s) => /^[A-Z.]+$/.test(s));
        allSymbols.push(...list);
      } catch (e) {
        console.warn("⚠️ โหลดตลาดล้มเหลว:", src, e.message);
      }
    }
    allSymbols = [...new Set(allSymbols)].slice(0, 7000);

    // สุ่มเลือก 300 ตัวต่อรอบ (ลดโหลด CPU / API)
    const sample = allSymbols.sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE);
    const results = [];

    // ===== ฟังก์ชันช่วย =====
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

    const newsSentiment = async (sym) => {
      try {
        const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
        const j = await r.json();
        const items = (j.news || []).slice(0, 10);
        let score = 0;
        for (const n of items) {
          const t = `${n.title || ""} ${n.summary || ""}`.toLowerCase();
          if (/(ai|growth|record|upgrade|expand|beat|contract|partnership|approval)/.test(t))
            score += 3;
          if (/(fraud|lawsuit|miss|cut|layoff|downgrade|probe|decline)/.test(t)) score -= 3;
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

    // ===== Loop สแกนหุ้น =====
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

        // ✅ เงื่อนไขหุ้นต้นน้ำ (ราคาถูก + แนวโน้มดีจริง)
        if (last > 35) continue;
        if (ema20 <= ema50) continue;
        if (rsi < 45 || rsi > 75) continue;
        if (sentiment <= 0) continue;

        const aiScore = Math.round((rsi - 45) * 2 + sentiment * 8);

        results.push({
          symbol: sym,
          price: Number(last.toFixed(2)),
          ema20: Number(ema20.toFixed(2)),
          ema50: Number(ema50.toFixed(2)),
          rsi: Math.round(rsi),
          sentiment,
          aiScore,
          reason: "AI พบแนวโน้มต้นน้ำแท้จริง + ข่าวดีต่อเนื่อง",
        });
      } catch {}
      await new Promise((r) => setTimeout(r, 40));
    }

    // ✅ รวมกับของเดิม แล้วอัปเดตเฉพาะตัวที่ดีกว่า
    const prev = globalThis.visionaryCache.topStocks || [];
    const combined = [...prev, ...results];

    // ลบตัวซ้ำ
    const unique = combined.reduce((acc, cur) => {
      if (!acc.find((x) => x.symbol === cur.symbol)) acc.push(cur);
      return acc;
    }, []);

    // คัด top 30 ตัวที่คะแนนสูงสุด
    const top = unique.sort((a, b) => b.aiScore - a.aiScore).slice(0, 30);

    // ✅ อัปเดตก็ต่อเมื่อเจอตัวที่ดีกว่า
    const prevMin = Math.min(...prev.map((x) => x.aiScore || 0));
    const newMax = Math.max(...results.map((x) => x.aiScore || 0));

    if (newMax > prevMin || prev.length === 0) {
      globalThis.visionaryCache.topStocks = top;
      globalThis.visionaryCache.lastUpdate = new Date().toISOString();
    }

    res.status(200).json({
      success: true,
      total: allSymbols.length,
      scanned: sample.length,
      discovered: globalThis.visionaryCache.topStocks,
      lastUpdate: globalThis.visionaryCache.lastUpdate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
    }
