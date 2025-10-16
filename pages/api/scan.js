// ✅ /pages/api/scan.js — AutoMarketScan v3.2 (Verified Working)
const SYMBOL_SOURCE = "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX";

function computeRSI14(closes = []) {
  const n = 14;
  closes = closes.filter((v) => typeof v === "number" && !isNaN(v));
  if (closes.length < n + 1) return null;

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
  if (!rsi || isNaN(rsi)) return "Neutral";
  if (rsi >= 55) return "Buy";
  if (rsi <= 45) return "Sell";
  return "Neutral";
}

function within(v, lo, hi) {
  if (lo != null && v < lo) return false;
  if (hi != null && v > hi) return false;
  return true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Transfer-Encoding", "chunked");

  const write = (obj) => res.write(JSON.stringify(obj) + "\n");

  try {
    const {
      mode = "Any",
      rsiMin = "0",
      rsiMax = "100",
      priceMin = "0",
      priceMax = "100000",
      maxSymbols = "8000",
      batchSize = "80",
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
    if (!listResp.ok) throw new Error("โหลดรายชื่อหุ้นล้มเหลว");

    const listJson = await listResp.json();
    let symbols = listJson.map((s) => s.ticker).filter(Boolean);
    if (symbols.length > LIMIT) symbols = symbols.slice(0, LIMIT);

    const total = symbols.length;
    write({ log: `🚀 เริ่มสแกน ${total} หุ้น...` });

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

            let closes =
              result.indicators?.quote?.[0]?.close?.filter(
                (v) => typeof v === "number" && !isNaN(v)
              ) || [];
            if (!closes?.length) return null;

            const meta = result.meta || {};
            const price =
              meta.regularMarketPrice ??
              closes.at(-1) ??
              meta.previousClose ??
              null;

            const rsi =
              computeRSI14(closes) ??
              computeRSI14(closes.slice(-20)) ??
              computeRSI14(closes.slice(-10)) ??
              null;
            if (!price || !rsi || isNaN(rsi)) return null;

            const ai = decideAISignal(rsi);
            if (
              mode.toLowerCase() !== "any" &&
              ai.toLowerCase() !== mode.toLowerCase()
            )
              return null;
            if (!within(price, P_MIN, P_MAX)) return null;
            if (!within(rsi, RSI_MIN, RSI_MAX)) return null;

            return {
              symbol,
              ai,
              rsi: +rsi.toFixed(2),
              price: +price.toFixed(2),
            };
          } catch {
            return null;
          }
        })
      );

      for (const r of results) {
        if (r.status !== "fulfilled" || !r.value) continue;
        found++;
        write({ hit: r.value });
      }

      const progress = Math.min(100, Math.round(((i + BATCH) / total) * 100));
      write({ progress, log: `📊 สแกนแล้ว ${(i + BATCH)}/${total}` });

      // ✅ แสดงสัญลักษณ์ที่กำลังตรวจทุก batch
      const showSymbol = batch[Math.floor(Math.random() * batch.length)];
      write({ log: `🔍 กำลังตรวจ ${showSymbol}` });

      await sleep(250);
    }

    write({
      done: true,
      log: `✅ สแกนครบแล้ว ${total} หุ้น — พบ ${found} หุ้นเข้าเงื่อนไข`,
    });
    if (found === 0) {
      write({
        log: "⚠️ ยังไม่พบหุ้นเข้าเงื่อนไข ลองขยายช่วง RSI/ราคา หรือตั้ง Mode=Any",
      });
    }
    res.end();
  } catch (err) {
    write({ error: err.message || String(err) });
    res.end();
  }
}
