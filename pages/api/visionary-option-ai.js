// ✅ Visionary Option AI API — Supreme Summary Engine
// ใช้เพื่อสรุปออปชัน (Call/Put, ROI, Confidence, Target, Zone) สำหรับหน้า /analyze และ Scanner

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "missing symbol" });

  try {
    // 🧠 ดึงข้อมูลหลักจาก Visionary Core (หรือ Infinite)
    const base = await fetch(`${process.env.BASE_URL || ""}/api/visionary-core?symbol=${symbol}`)
      .then((r) => r.json())
      .catch(() => ({}));

    const last = base.lastClose || 0;
    const rsi = base.rsi || 50;
    const trend = base.trend || "Neutral";

    // 🧩 คำนวณสัญญาณออปชัน
    let action = "Hold";
    let confidence = 60;
    let reason = "รอการยืนยันเพิ่มเติม";
    let zone = "Neutral Zone";

    let score = 0;
    if (last > base.ema20) score++;
    if (base.ema20 > base.ema50) score++;
    if (base.ema50 > base.ema200) score++;
    if (rsi > 55) score++;
    if (trend === "Uptrend") score += 0.5;
    if (trend === "Downtrend") score -= 0.5;

    if (score >= 3) {
      action = "Buy";
      confidence = 85;
      reason = "แนวโน้มขาขึ้นแข็งแรง";
      zone = "Active Buy Zone";
    } else if (score <= 1) {
      action = "Sell";
      confidence = 75;
      reason = "แรงขายกดดัน";
      zone = "Caution Zone";
    }

    // 🎯 คำนวณเป้าหมายราคา
    const target = +(last * (action === "Buy" ? 1.08 : 0.95)).toFixed(2);

    // 💰 คำนวณ Option Call / Put
    const topCall = {
      strike: +(last * 1.03).toFixed(2),
      premium: +(Math.max(0.3, last * 0.03)).toFixed(2),
      roi: +(Math.min(120, confidence + 20)).toFixed(0),
    };
    const topPut = {
      strike: +(last * 0.97).toFixed(2),
      premium: +(Math.max(0.25, last * 0.025)).toFixed(2),
      roi: +(Math.max(10, 100 - confidence)).toFixed(0),
    };

    // ✅ สรุปสุดท้าย
    const data = {
      symbol: symbol.toUpperCase(),
      signal: action,
      confidence,
      reason,
      target,
      zone,
      rsi,
      topCall,
      topPut,
    };

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ Option AI Error:", err);
    return res.status(500).json({ error: "Visionary Option AI failed." });
  }
      }
