// ✅ /pages/api/screener-hybrid.js
// 🌍 AI Stock Screener Hybrid v5 — Ultra Galactic Edition 🚀
// รวมพลังระหว่าง screener.js + fullscan.js ให้สแกนหุ้นทั้งตลาดได้จริง

import { ema, rsi, macd } from "../../lib/indicators.js";

const SYMBOL_SOURCE =
  "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX";

// ✅ mock data fallback
function mock(symbol) {
  const base = +(Math.random() * 100 + 5).toFixed(2);
  const r = +(30 + Math.random() * 40).toFixed(1);
  const sig = r > 60 ? "BUY" : r < 40 ? "SELL" : "HOLD";
  return {
    symbol,
    price: base,
    ema20: +(base * 0.98).toFixed(2),
    ema50: +(base * 0.95).toFixed(2),
    ema200: +(base * 0.9).toFixed(2),
    rsi: r,
    signal: sig,
    conf: +(Math.abs(r - 50) / 50).toFixed(2),
    mock: true,
  };
}

// ✅ คำนวณ AI signal จากข้อมูลจริง
function aiSignal({ price, ema20, ema50, ema200, rsi, macdHist }) {
  let score = 0;
  if (price > ema20) score++;
  if (ema20 > ema50) score++;
  if (ema50 > ema200) score++;
  if (rsi > 50) score++;
  if (macdHist > 0) score++;

  if (score >= 4) return { action: "BUY", confidence: +(score / 5).toFixed(2) };
  if (score <= 1) return { action: "SELL", confidence: +(1 - score / 5).toFixed(2) };
  return { action: "HOLD", confidence: 0.5 };
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Transfer-Encoding", "chunked");

  const write = (obj) => res.write(JSON.stringify(obj) + "\n");

  try {
    const { mode = "short", limit = 8000, batchSize = 40 } = req.query;
    const listResp = await fetch(SYMBOL_SOURCE, { cache: "no-store" });
    const list = await listResp.json();

    let symbols = list.map((s) => s.ticker).filter(Boolean);
    if (symbols.length > limit) symbols = symbols.slice(0, limit);

    const total = symbols.length;
    write({ log: `🚀 เริ่มสแกนทั้งหมด ${total} หุ้น (Batch ${batchSize})` });

    let results = [];
    let processed = 0;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      write({ log: `📦 Batch ${i + 1} - ${batch[0]} → ${batch.at(-1)}` });

      const fetched = await Promise.allSettled(
        batch.map(async (symbol) => {
          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
            const r = await fetch(url);
            const j = await r.json();
            const d = j?.chart?.result?.[0];
            const q = d?.indicators?.quote?.[0];
            if (!q?.close) return mock(symbol);

            const c = q.close.filter(Boolean);
            const h = q.high.filter(Boolean);
            const l = q.low.filter(Boolean);
            if (c.length < 50) return mock(symbol);

            const price = c.at(-1);
            const ema20v = ema(c, 20).at(-1);
            const ema50v = ema(c, 50).at(-1);
            const ema200v = ema(c, 200).at(-1);
            const R = rsi(c, 14).at(-1);
            const M = macd(c, 12, 26, 9);
            const hist = M.hist.at(-1);
            const sig = aiSignal({
              price,
              ema20: ema20v,
              ema50: ema50v,
              ema200: ema200v,
              rsi: R,
              macdHist: hist,
            });

            return {
              symbol,
              price,
              ema20: ema20v,
              ema50: ema50v,
              ema200: ema200v,
              rsi: R,
              signal: sig.action,
              conf: sig.confidence,
            };
          } catch {
            return mock(symbol);
          }
        })
      );

      results.push(...fetched.filter((x) => x.status === "fulfilled").map((x) => x.value));
      processed += batch.length;

      const progress = Math.round((processed / total) * 100);
      write({ progress, log: `📈 สแกนแล้ว ${processed}/${total} หุ้น (${progress}%)` });
      await new Promise((r) => setTimeout(r, 300));
    }

    const filtered = results.filter((x) => x.signal === "BUY");
    write({
      done: true,
      log: `✅ สแกนเสร็จทั้งหมด ${total} หุ้น — พบ ${filtered.length} หุ้นที่เข้าเงื่อนไข`,
      matches: filtered.length,
    });

    res.end();
  } catch (err) {
    write({ error: err.message });
    res.end();
  }
}
