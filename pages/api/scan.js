// ✅ /pages/api/scan.js — ระบบสแกนหุ้นทั้งตลาด (NASDQ + NYSE + AMEX)
const SYMBOL_SOURCE = "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX";

function computeRSI14(closes) {
  const n = 14;
  if (!closes || closes.length < n + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
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

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default async function handler(req, res) {
  try {
    const {
      mode = "Any",
      rsiMin = "0",
      rsiMax = "100",
      priceMin = "0",
      priceMax = "100000",
      maxSymbols = "1000",
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
    if (!listResp.ok) throw new Error("Load symbol list failed");
    const listJson = await listResp.json();
    let symbols = listJson.map(s => s.ticker).filter(Boolean);
    if (symbols.length > LIMIT) symbols = symbols.slice(0, LIMIT);

    const matches = [];
    let processed = 0;

    for (let i = 0; i < symbols.length; i += BATCH) {
      const batch = symbols.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map(async (symbol) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
          const resp = await fetch(url, { cache: "no-store" });
          if (!resp.ok) return null;
          const data = await resp.json();
          const result = data?.chart?.result?.[0];
          if (!result) return null;
          const closes = result.indicators?.quote?.[0]?.close || [];
          const meta = result.meta || {};
          let price = meta.regularMarketPrice ??
                      (closes.length ? closes.at(-1) : null) ??
                      meta.previousClose ?? null;
          const rsi = computeRSI14(closes);
          const ai = decideAISignal(rsi);
          if (!price || !rsi) return null;
          return { symbol, price: +price.toFixed(2), rsi: +rsi.toFixed(2), ai };
        } catch { return null; }
      }));

      for (const r of results) {
        if (r.status !== "fulfilled" || !r.value) continue;
        const { symbol, price, rsi, ai } = r.value;
        if (!within(price, P_MIN, P_MAX)) continue;
        if (!within(rsi, RSI_MIN, RSI_MAX)) continue;
        if (mode !== "Any" && ai !== mode) continue;
        matches.push({ symbol, ai, rsi, price });
      }

      processed += batch.length;
      console.log(`[SCAN] Batch done: ${processed}/${symbols.length}`);
      await sleep(300);
    }

    matches.sort((a, b) => (b.ai === "Buy") - (a.ai === "Buy") || b.rsi - a.rsi);
    res.status(200).json({ ok: true, scanned: processed, found: matches.length, items: matches });
  } catch (err) {
    console.error("[scan] error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
      }
