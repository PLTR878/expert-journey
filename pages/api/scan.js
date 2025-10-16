// ✅ /pages/api/scan.js — Visionary AutoMarketScan (SSE version)
const SYMBOL_SOURCE = "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX";

function computeRSI14(closes) {
  const n = 14;
  if (!closes || closes.length < n + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / n;
  let avgLoss = losses / n;
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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function handler(req, res) {
  // ✅ SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const {
      mode = "Any",
      rsiMin = "0",
      rsiMax = "100",
      priceMin = "0",
      priceMax = "100000",
      maxSymbols = "5000",
      batchSize = "50",
      range = "3mo",
      interval = "1d",
    } = req.query;

    const RSI_MIN = Number(rsiMin);
    const RSI_MAX = Number(rsiMax);
    const P_MIN = Number(priceMin);
    const P_MAX = Number(priceMax);
    const LIMIT = Number(maxSymbols);
    const BATCH = Number(batchSize);

    const listResp = await fetch(SYMBOL_SOURCE, { cache: "no-store" });
    if (!listResp.ok) throw new Error("โหลดรายชื่อหุ้นไม่สำเร็จ");

    const listJson = await listResp.json();
    let symbols = listJson.map((s) => s.ticker).filter(Boolean);
    if (symbols.length > LIMIT) symbols = symbols.slice(0, LIMIT);

    const total = symbols.length;
    send({ log: `🚀 เริ่มสแกนหุ้นทั้งหมด ${total} ตัว...` });

    let found = 0;

    for (let i = 0; i < total; i += BATCH) {
      const batch = symbols.slice(i, i + BATCH);

      const results = await Promise.allSettled(
        batch.map(async (symbol) => {
          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
            const resp = await fetch(url, { cache: "no-store" });
            if (!resp.ok) return null;
            const data = await resp.json();
            const result = data?.chart?.result?.[0];
            if (!result) return null;

            const closes = result.indicators?.quote?.[0]?.close || [];
            const meta = result.meta || {};
            const price = meta.regularMarketPrice ?? closes.at(-1) ?? null;
            const rsi = computeRSI14(closes);
            const ai = decideAISignal(rsi);
            if (!price || !rsi) return null;
            if (!within(price, P_MIN, P_MAX)) return null;
            if (!within(rsi, RSI_MIN, RSI_MAX)) return null;
            if (mode !== "Any" && ai !== mode) return null;

            return { symbol, ai, rsi: +rsi.toFixed(2), price: +price.toFixed(2) };
          } catch {
            return null;
          }
        })
      );

      for (const r of results) {
        if (r.status !== "fulfilled" || !r.value) continue;
        found++;
        send({ hit: r.value });
      }

      const progress = Math.min(100, Math.round(((i + BATCH) / total) * 100));
      send({ progress, log: `📊 กำลังสแกน... ${progress}%` });
      await sleep(200);
    }

    send({ done: true, log: `✅ สแกนครบแล้ว พบ ${found} หุ้นเข้าเงื่อนไข` });
    res.end();
  } catch (err) {
    send({ error: err.message || String(err) });
    res.end();
  }
}
