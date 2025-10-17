// /pages/api/scan.js

const SYMBOLS = [
  "AAPL","MSFT","NVDA","AMZN","META","GOOGL","TSLA","PLUG","SMCI",
  "GWH","SLDP","AEHR","BIO","BIMI","ACU","ACV","ACWI","ZIM","XFOR",
  "NRGV","LWLG","BEEM","CHPT","IONQ","ENVX","VFS","NVTS","FREY","QS"
];

const SLEEP_MS = 250;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function calcRSI(values, period = 14) {
  if (!values || values.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export default async function handler(req, res) {
  try {
    const {
      cursor: cursorStr = "0",
      mode = "Buy",
      rsiMin = "35",
      rsiMax = "55",
      priceMin = "1",
      priceMax = "30",
    } = req.query;

    const cursor = parseInt(cursorStr);
    const batchSize = 10;
    const slice = SYMBOLS.slice(cursor, cursor + batchSize);
    const matches = [];

    for (const sym of slice) {
      const url = `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json().catch(() => null);
      const q = j?.chart?.result?.[0]?.indicators?.quote?.[0];
      const closes = q?.close?.filter(Number.isFinite) || [];
      const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice ?? closes.at(-1) ?? 0;
      if (!price) continue;

      const RSI = calcRSI(closes);
      if (!RSI) continue;

      const signal = RSI > 60 ? "Sell" : RSI < 40 ? "Buy" : "Hold";

      if (mode === "Buy" && signal !== "Buy") continue;
      if (mode === "Sell" && signal !== "Sell") continue;
      if (price < Number(priceMin) || price > Number(priceMax)) continue;
      if (RSI < Number(rsiMin) || RSI > Number(rsiMax)) continue;

      matches.push({ symbol: sym, price, RSI: RSI.toFixed(1), signal });
      await sleep(SLEEP_MS);
    }

    const nextCursor = cursor + batchSize;
    const done = nextCursor >= SYMBOLS.length;

    res.status(200).json({
      ok: true,
      matches,
      nextCursor: done ? null : nextCursor,
      done,
      progress: Math.min(100, Math.round((nextCursor / SYMBOLS.length) * 100)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
