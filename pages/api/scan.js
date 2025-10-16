// /pages/api/scan.js  (Next.js Pages Router)
// ถ้าใช้ App Router ให้ปรับเป็น export async function GET(req){} และใช้ new URL(req.url).searchParams แทน

const SYMBOL_SOURCE = "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX";

// ---- Utilities ----
function computeRSI14(closes) {
  // ต้องมีอย่างน้อย 15 แท่ง
  const n = 14;
  if (!closes || closes.length < n + 1) return null;
  let gains = 0, losses = 0;

  // ค่าแรก
  for (let i = 1; i <= n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / n;
  let avgLoss = losses / n;

  // คำนวณแบบ Wilder smoothing
  for (let i = n + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (n - 1) + gain) / n;
    avgLoss = (avgLoss * (n - 1) + loss) / n;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function decideAISignal(rsi) {
  if (rsi == null) return "Neutral";
  if (rsi >= 55) return "Buy";
  if (rsi <= 45) return "Sell";
  return "Neutral";
}

function within(v, lo, hi) {
  if (lo != null && v < lo) return false;
  if (hi != null && v > hi) return false;
  return true;
}

async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

export default async function handler(req, res) {
  try {
    const {
      mode = "Any",       // Buy | Sell | Neutral | Any
      rsiMin = "0",
      rsiMax = "100",
      priceMin = "0",
      priceMax = "100000",
      maxSymbols = "2500",  // กันโหลดเยอะเกิน (ทั้งตลาด ~7-8k+)
      batchSize = "50",     // 50–100 แนะนำ
      range = "3mo",        // ใช้ข้อมูลพอคำนวณ RSI-14 ได้
      interval = "1d",
    } = req.query;

    const RSI_MIN = Number(rsiMin);
    const RSI_MAX = Number(rsiMax);
    const P_MIN = Number(priceMin);
    const P_MAX = Number(priceMax);
    const LIMIT = Number(maxSymbols);
    const BATCH = Number(batchSize);

    // 1) ดึงรายชื่อหุ้นทั้งตลาด (dynamic)
    const listResp = await fetch(SYMBOL_SOURCE, { cache: "no-store" });
    if (!listResp.ok) throw new Error("Load symbol list failed");
    const listJson = await listResp.json();
    let symbols = listJson.map(s => s.ticker).filter(Boolean);

    // จำกัดจำนวนเพื่อเวลา/โควต้า API
    if (symbols.length > LIMIT) symbols = symbols.slice(0, LIMIT);

    const matches = [];
    let processed = 0;

    // 2) ไล่สแกนเป็น batch เพื่อกัน timeout / rate-limit
    for (let i = 0; i < symbols.length; i += BATCH) {
      const batch = symbols.slice(i, i + BATCH);

      const results = await Promise.allSettled(
        batch.map(async (symbol) => {
          // Yahoo chart API: เอาปิดย้อนหลังมาคำนวณ RSI เอง
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
          const resp = await fetch(url, { cache: "no-store" });
          if (!resp.ok) throw new Error("chart fetch failed");
          const data = await resp.json();
          const result = data?.chart?.result?.[0];
          if (!result) throw new Error("no result");

          const meta = result.meta || {};
          const closes = result.indicators?.quote?.[0]?.close || [];

          // ราคาปัจจุบัน/ล่าสุด กัน undefined
          let price =
            meta.regularMarketPrice ??
            (closes.length ? closes[closes.length - 1] : null) ??
            meta.previousClose ??
            null;

          const rsi = computeRSI14(closes);
          const ai = decideAISignal(rsi);

          return { symbol, price, rsi, ai };
        })
      );

      // 3) กรองตามเงื่อนไข
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { symbol, price, rsi, ai } = r.value;

        // ตัดตัวที่ไม่มีราคาหรือ RSI
        if (price == null || rsi == null) continue;

        // กรองราคา/RSI
        if (!within(price, P_MIN, P_MAX)) continue;
        if (!within(rsi, RSI_MIN, RSI_MAX)) continue;

        // กรองโหมด
        if (mode !== "Any" && ai !== mode) continue;

        matches.push({
          symbol,
          ai,
          rsi: Number(rsi.toFixed(2)),
          price: Number(price.toFixed(2)),
        });
      }

      processed += batch.length;

      // เคารพ rate-limit เบา ๆ
      await sleep(200); // 0.2s ระหว่าง batch
    }

    // เรียงผล: เน้น Buy RSI สูงก่อน
    matches.sort((a, b) => (b.ai === "Buy") - (a.ai === "Buy") || b.rsi - a.rsi);

    return res.status(200).json({
      ok: true,
      totalSymbols: symbols.length,
      scanned: processed,
      found: matches.length,
      items: matches, // ส่งกลับไปโชว์ใน Latest Matches
    });
  } catch (err) {
    console.error("[scan] error:", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
      }
