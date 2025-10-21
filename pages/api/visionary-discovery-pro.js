// ✅ Visionary Discovery Pro V∞.AI — หุ้นต้นน้ำอนาคตไกล (ราคาต่ำกว่า $35)
export default async function handler(req, res) {
  try {
    // ✅ รายชื่อหุ้นจริง (Small/Mid Cap ราคาต่ำกว่า $35)
    const TICKERS = [
      "PLTR","SOFI","RIVN","CHPT","RUN","SLDP","NRGV","GWH","BBAI","IONQ",
      "ENVX","QS","MVST","BEEM","AEHR","OKLO","NVTS","XMTR","UPST","CLSK",
      "NU","DNA","ASTS","MARA","RIOT","CLNE","WKHS","FCEL","EVGO","STEM",
      "FREY","WULF","CANO","JOBY","LILM","ACHR","VFS","LAC","PLL","SMR"
    ];

    // ===== Utilities =====
    const fetchChart = async (sym) => {
      const u = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
      const r = await fetch(u);
      const j = await r.json();
      return j?.chart?.result?.[0];
    };

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

    const fetchNewsScore = async (sym) => {
      try {
        const u = `https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`;
        const r = await fetch(u);
        const j = await r.json();
        const items = (j.news || []).slice(0, 10);
        let score = 0;
        for (const n of items) {
          const text = `${n.title || ""} ${n.summary || ""}`.toLowerCase();
          if (/(ai|partnership|growth|record|expand|contract|launch|approval|award)/.test(text))
            score += 2;
          if (/(lawsuit|cut|layoff|downgrade|decline|probe|loss|warning)/.test(text))
            score -= 2;
        }
        return score;
      } catch {
        return 0;
      }
    };

    // ===== AI Logic =====
    const analyzeStock = async (sym) => {
      try {
        const d = await fetchChart(sym);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        if (!closes?.length) return null;

        const last = closes.at(-1);
        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const ema200 = EMA(closes, 200);
        const rsi = RSI(closes);

        const trend =
          last > ema20 && ema20 > ema50 && rsi > 55
            ? "Uptrend"
            : last < ema20 && ema20 < ema50 && rsi < 45
            ? "Downtrend"
            : "Sideway";

        const newsScore = await fetchNewsScore(sym);

        // === AI Score ===
        let aiScore =
          (rsi - 50) * 2 +
          (trend === "Uptrend" ? 15 : trend === "Sideway" ? 5 : 0) +
          newsScore * 8;
        aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));

        // === Reasoning ===
        const reason =
          aiScore > 80
            ? "AI พบแนวโน้มต้นน้ำชัดเจน + ข่าวเชิงบวกต่อเนื่อง"
            : aiScore > 60
            ? "เริ่มก่อตัวของแนวโน้มบวกในตลาดย่อย"
            : "ยังไม่ชัดเจน รอสัญญาณเพิ่มเติม";

        return {
          symbol: sym,
          lastClose: Number(last.toFixed(2)),
          rsi: Math.round(rsi),
          ema20: Number(ema20?.toFixed(2) || 0),
          ema50: Number(ema50?.toFixed(2) || 0),
          ema200: Number(ema200?.toFixed(2) || 0),
          trend,
          aiScore,
          reason,
        };
      } catch {
        return null;
      }
    };

    // ===== Parallel scan =====
    const settled = await Promise.allSettled(TICKERS.map((s) => analyzeStock(s)));
    const all = settled.map((x) => (x.status === "fulfilled" ? x.value : null)).filter(Boolean);

    // ===== Filter: ราคาต่ำกว่า $35 =====
    const filtered = all.filter((x) => x.lastClose && x.lastClose <= 35);

    // ===== Top 50 sorted =====
    const discovered = filtered.sort((a, b) => b.aiScore - a.aiScore).slice(0, 50);

    return res.status(200).json({
      success: true,
      count: discovered.length,
      discovered,
      timestamp: new Date().toISOString(),
      engine: "V∞.AI Discovery Core",
      note: "คัดเฉพาะหุ้นราคาต่ำกว่า $35 และมีแนวโน้มเติบโตจากข่าว+โครงสร้างราคา",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
                                     }
