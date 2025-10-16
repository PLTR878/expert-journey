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
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");

  const write = (obj) => res.write(JSON.stringify(obj) + "\n");

  try {
    const {
      mode = "Any",
      rsiMin = "0",
      rsiMax = "100",
      priceMin = "0",
      priceMax = "100000",
      maxSymbols = "500",
      batchSize = "40",
      range = "3mo",
      interval = "1d",
    } = req.query;

    const listResp = await fetch(SYMBOL_SOURCE, { cache: "no-store" });
    const listJson = await listResp.json();
    let symbols = listJson.map((s) => s.ticker).filter(Boolean);
    if (symbols.length > Number(maxSymbols)) symbols = symbols.slice(0, Number(maxSymbols));

    const total = symbols.length;
    write({ log: `🚀 เริ่มสแกนทั้งหมด ${total} หุ้น` });

    let found = 0;
    for (let i = 0; i < total; i += Number(batchSize)) {
      const batch = symbols.slice(i, i + Number(batchSize));
      const results = await Promise.allSettled(
        batch.map(async (symbol) => {
          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
            const resp = await fetch(url);
            const data = await resp.json();
            const result = data?.chart?.result?.[0];
            if (!result) return null;
            const closes = result.indicators?.quote?.[0]?.close || [];
            const price = result.meta?.regularMarketPrice ?? closes.at(-1) ?? null;
            const rsi = computeRSI14(closes);
            const ai = decideAISignal(rsi);
            if (!price || !rsi) return null;
            return { symbol, ai, rsi: +rsi.toFixed(2), price: +price.toFixed(2) };
          } catch {
            return null;
          }
        })
      );
      for (const r of results) {
        if (r.status !== "fulfilled" || !r.value) continue;
        write({ hit: r.value });
        found++;
      }
      write({ progress: Math.round((i / total) * 100) });
      await sleep(300);
    }

    write({ done: true, log: `✅ สแกนครบ พบ ${found} หุ้นเข้าเงื่อนไข` });
    res.end();
  } catch (err) {
    write({ error: err.message });
    res.end();
  }
    }
