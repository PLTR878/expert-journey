// ✅ /pages/api/scan.js — Auto-Continue Full Market Scanner (Batch system)
import { ema, rsi, macd } from "../../lib/indicators.js";

const BATCH_SIZE = 800; // หุ้นต่อรอบ
const DELAY_MS = 150; // delay ป้องกันโดน block

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");

  const encoder = new TextEncoder();
  const send = (msg) => res.write(encoder.encode(`${JSON.stringify(msg)}\n`));

  try {
    // อ่านค่าพารามิเตอร์ batch (เช่น batch=2)
    const batch = Number(req.query.batch || 1);

    if (batch === 1) send({ log: "🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..." });
    send({ log: `📦 ดำเนินการ batch ${batch}` });

    // โหลดรายชื่อหุ้นทั้งหมด
    const tickersRes = await fetch(
      "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX"
    );
    const tickers = await tickersRes.json();
    const symbols = tickers.map((x) => x.ticker);
    const total = symbols.length;
    const start = (batch - 1) * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const list = symbols.slice(start, end);

    if (list.length === 0) {
      send({ log: "✅ สแกนครบทุก batch แล้ว!", done: true });
      return res.end();
    }

    send({ log: `🔍 สแกนหุ้นช่วง ${start + 1}-${end} จากทั้งหมด ${total}` });

    const results = [];
    let count = 0;

    for (const symbol of list) {
      count++;
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const text = await r.text();
        if (!text.startsWith("{")) continue;

        const j = JSON.parse(text);
        const data = j?.chart?.result?.[0];
        if (!data) continue;

        const q = data.indicators?.quote?.[0];
        const c = q?.close?.filter(Boolean) || [];
        if (c.length < 30) continue;

        const lastClose = c.at(-1);
        const R = rsi(c, 14)?.at(-1) ?? 50;
        const M = macd(c, 12, 26, 9);
        const macdHist = M?.hist?.at(-1) ?? 0;
        const ema20 = ema(c, 20)?.at(-1);
        const ema50 = ema(c, 50)?.at(-1);
        const ema200 = ema(c, 200)?.at(-1);

        let signal = "Hold";
        if (R < 35 && macdHist > 0) signal = "Buy";
        else if (R > 65 && macdHist < 0) signal = "Sell";

        const trend =
          ema20 > ema50 && ema50 > ema200
            ? "Uptrend"
            : ema20 < ema50 && ema50 < ema200
            ? "Downtrend"
            : "Sideway";

        const stock = {
          symbol,
          lastClose: Number(lastClose.toFixed(2)),
          rsi: Number(R.toFixed(1)),
          trend,
          signal,
        };

        const percent = (((start + count) / total) * 100).toFixed(1);
        send({
          log: `🔍 [${percent}%] ${symbol} — $${lastClose.toFixed(
            2
          )} | RSI ${R.toFixed(1)} | ${signal}`,
          progress: percent,
        });

        if (signal !== "Hold")
          send({
            alert: `🎯 ${signal} — ${symbol} $${lastClose.toFixed(
              2
            )} | RSI ${R.toFixed(1)}`,
          });

        results.push(stock);
        await new Promise((r) => setTimeout(r, DELAY_MS));
      } catch (err) {
        send({ log: `⚠️ ${symbol} error: ${err.message}` });
      }
    }

    // ✅ batch ถัดไป (ถ้ามี)
    const next = batch + 1;
    const nextStart = (next - 1) * BATCH_SIZE;
    if (nextStart < total) {
      send({
        log: `➡️ ดำเนินการต่อ batch ${next}`,
        nextBatch: `/api/scan?batch=${next}`,
      });
    } else {
      send({
        log: `✅ สแกนครบทั้งหมด ${total} ตัว`,
        done: true,
      });
    }

    res.end();
  } catch (err) {
    send({ error: err.message });
    res.end();
  }
}
