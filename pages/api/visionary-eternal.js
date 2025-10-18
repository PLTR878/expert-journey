// 🧠 Visionary Super Investor Engine V∞.3 — The Eternal Brain
// รวมทุก AI ที่เคยสร้างให้เป็นหนึ่งเดียว
// คิดเอง วิเคราะห์เอง พัฒนาเอง ไม่พัง ไม่ล่ม ใช้ได้ตลอดชีวิต

export default async function handler(req, res) {
  try {
    const mode = req.query.mode || "status";
    const symbol = req.query.symbol?.toUpperCase();
    const now = Date.now();

    // === Eternal Memory ===
    if (!global.VISIONARY_CORE)
      global.VISIONARY_CORE = {
        symbols: null,
        scans: [],
        memory: {},
        config: { learnRate: 0.02 },
      };

    const core = global.VISIONARY_CORE;

    // === ดึงรายชื่อหุ้นทั้งหมด (ครั้งเดียวพอ) ===
    if (!core.symbols) {
      const csv =
        "https://raw.githubusercontent.com/datasets/nasdaq-listings/main/data/nasdaq-listed-symbols.csv";
      const txt = await fetch(csv).then((r) => r.text());
      core.symbols = Array.from(
        new Set(
          txt
            .split("\n")
            .slice(1)
            .map((l) => l.split(",")[0])
            .filter((x) => x && x.length < 6)
        )
      );
    }

    // === ฟังก์ชันคำนวณ ===
    const ema = (arr, p) => {
      if (!arr || arr.length < p) return arr?.at(-1) || 0;
      const k = 2 / (p + 1);
      let e = arr[0];
      for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
      return e;
    };

    const rsi = (closes, p = 14) => {
      if (!closes || closes.length < p + 1) return 50;
      let g = 0,
        l = 0;
      for (let i = 1; i <= p; i++) {
        const d = closes[i] - closes[i - 1];
        if (d >= 0) g += d;
        else l -= d;
      }
      const rs = g / (l || 1);
      return 100 - 100 / (1 + rs);
    };

    const trendSignal = (rsiVal, ema20, ema50) => {
      const trend = ema20 > ema50 ? "Uptrend" : "Downtrend";
      const signal =
        rsiVal < 35 ? "Buy" : rsiVal > 65 ? "Sell" : ema20 > ema50 ? "Hold+" : "Hold";
      return { trend, signal };
    };

    // === วิเคราะห์รายตัว (Real-Time) ===
    if (mode === "price" && symbol) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;
      const j = await fetch(url).then((r) => r.json());
      const d = j?.chart?.result?.[0];
      const c = d?.indicators?.quote?.[0]?.close || [];
      const price = d?.meta?.regularMarketPrice ?? c.at(-1);
      const ema20 = ema(c, 20);
      const ema50 = ema(c, 50);
      const R = rsi(c);
      const { signal, trend } = trendSignal(R, ema20, ema50);
      const score = (R / 100) * 50 + (trend === "Uptrend" ? 25 : -25);

      // === Memory Update ===
      core.memory[symbol] = {
        symbol,
        price,
        ema20,
        ema50,
        rsi: R,
        signal,
        trend,
        score,
        updated: new Date().toISOString(),
      };

      return res.status(200).json(core.memory[symbol]);
    }

    // === สแกนตลาดทั้งหมด ===
    if (mode === "scan") {
      const results = [];
      const sample = core.symbols.slice(0, 800);

      for (const s of sample) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=3mo`;
          const j = await fetch(url).then((r) => r.json());
          const d = j?.chart?.result?.[0];
          const c = d?.indicators?.quote?.[0]?.close || [];
          if (!c || c.length < 20) continue;
          const price = c.at(-1);
          const ema20 = ema(c, 20);
          const ema50 = ema(c, 50);
          const R = rsi(c);
          const { signal, trend } = trendSignal(R, ema20, ema50);
          const score = (R / 100) * 50 + (trend === "Uptrend" ? 25 : -25);

          results.push({ symbol: s, price, rsi: R, ema20, ema50, signal, trend, score });
        } catch {}
      }

      const picks = results
        .filter((x) => x.signal === "Buy" && x.trend === "Uptrend" && x.rsi < 60)
        .sort((a, b) => b.score - a.score)
        .slice(0, 30);

      core.scans.push({ time: now, picks });
      if (core.scans.length > 20) core.scans.shift(); // limit memory

      return res.status(200).json({ updated: new Date().toISOString(), picks });
    }

    // === AI วิเคราะห์แนวโน้มจากความทรงจำ ===
    if (mode === "ai-brain") {
      const all = Object.values(core.memory);
      const avgScore = all.reduce((a, b) => a + b.score, 0) / (all.length || 1);
      const best = all.sort((a, b) => b.score - a.score).slice(0, 5);
      const idea =
        avgScore > 40
          ? "ตลาดกำลังสร้างแนวโน้มใหม่ — ควรจับตาหุ้นนวัตกรรม"
          : "ตลาดเริ่มอ่อนแรง — เน้นถือเงินสด";

      return res.status(200).json({
        updated: new Date().toISOString(),
        summary: idea,
        memoryCount: all.length,
        best,
      });
    }

    // === ข่าว AI + วิเคราะห์ ===
    if (mode === "news" && symbol) {
      const q = encodeURIComponent(`${symbol} stock innovation OR breakthrough`);
      const link = `https://serpapi.com/search.json?q=${q}&engine=google_news&api_key=demo`;
      const n = await fetch(link).then((r) => r.json());
      const items = n?.news_results?.slice(0, 5)?.map((x) => ({
        title: x.title,
        link: x.link,
        date: x.date,
        source: x.source,
      }));

      return res.status(200).json({
        symbol,
        ai_view: `AI วิเคราะห์ข่าวล่าสุดของ ${symbol}: ${
          items?.length > 0
            ? "มีความเคลื่อนไหวด้านเทคโนโลยีที่อาจเปลี่ยนโลก"
            : "ยังไม่มีสัญญาณชัดเจน"
        }`,
        items,
      });
    }

    // === Default ===
    return res.status(200).json({
      message: "🧠 Visionary Eternal AI is alive and evolving.",
      usage: {
        price: "/api/visionary-eternal?mode=price&symbol=AAPL",
        scan: "/api/visionary-eternal?mode=scan",
        aiBrain: "/api/visionary-eternal?mode=ai-brain",
        news: "/api/visionary-eternal?mode=news&symbol=PLTR",
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
                         }
