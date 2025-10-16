import { ema, rsi, macd, atr } from '../../lib/indicators.js';

export default async function handler(req, res) {
  try {
    const { symbol, range = '6mo', interval = '1d' } = req.query;
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    // ✅ ดึงข้อมูลราคาจาก API history
    const h = await fetch(`${base}/api/history?symbol=${symbol}&range=${range}&interval=${interval}`).then(r => r.json());
    const rows = h.rows || [];
    if (!rows.length) return res.status(404).json({ error: 'no data' });

    // ✅ แยกข้อมูลราคา
    const c = rows.map(r => r.c);
    const hi = rows.map(r => r.h);
    const lo = rows.map(r => r.l);
    const lastClose = c.at(-1);

    // ✅ คำนวณ indicators
    const ema20 = ema(c, 20).at(-1);
    const ema50 = ema(c, 50).at(-1);
    const ema200 = ema(c, 200).at(-1);

    const R = rsi(c, 14).at(-1);
    const M = macd(c, 12, 26, 9);
    const atr14 = atr(hi, lo, c, 14).at(-1);

    // ✅ ตรวจสอบค่าผิดพลาด
    const safe = v => (Number.isFinite(v) ? v : null);

    // ✅ ส่งออกข้อมูลแบบครบทุกฟิลด์ (รวม rsi และ rsi14)
    res.status(200).json({
      lastClose: safe(lastClose),
      ema20: safe(ema20),
      ema50: safe(ema50),
      ema200: safe(ema200),
      rsi: safe(R),          // 👈 เพิ่มชื่อสั้นให้ตรงกับหน้า analyze.js
      rsi14: safe(R),        // 👈 คงของเดิมไว้ด้วย
      macd: {
        line: safe(M.line.at(-1)),
        signal: safe(M.signal.at(-1)),
        hist: safe(M.hist.at(-1))
      },
      atr: safe(atr14),
      atr14: safe(atr14)
    });
  } catch (e) {
    console.error("Indicator error:", e);
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
}
