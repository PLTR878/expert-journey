// ✅ /pages/api/scan.js — Full Auto Scan + Save Matches to /data/scan-latest.json

import fs from "fs";
import path from "path";
import { ema, rsi, macd } from "../../lib/indicators.js";

const BATCH_SIZE = 800; // หุ้นต่อ batch
const DELAY_MS = 150; // หน่วงต่อหุ้น ป้องกันโดน block
const SAVE_PATH = path.join(process.cwd(), "data", "scan-latest.json");

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");

  const encoder = new TextEncoder();
  const send = (msg) => res.write(encoder.encode(`${JSON.stringify(msg)}\n`));

  try {
    const batch = Number(req.query.batch || 1);
    if (batch === 1) send({ log: "🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..." });
    send({ log: `📦 Batch ${batch} กำลังเริ่มทำงาน...` });

    // โหลดรายชื่อหุ้นทั้งหมด
    const tickersRes = await fetch(
      "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX"
    );
    const tickers = await tickersRes.json();
    const symbols = tickers.map((x) => x.ticker);
    const total = symbols.length;
    const start = (batch - 1) * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, total);
    const list = symbols.slice(start, end);

    if (list.length === 0) {
      send({ log: "✅ สแกนครบทุก batch แล้ว!", done: true });
      return res.end();
    }

    const matches = fs.existsSync(SAVE_PATH)
      ? JSON.parse(fs.readFileSync(SAVE_PATH, "utf8"))
      : [];

    send({
      log: `🔍 สแกนหุ้นช่วง ${start + 1}-${end} จาก ${total} ตัว`,
    });

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

        const percent = (((start + count) / total) * 100).toFixed(1);

        send({
          log: `🔎 [${percent}%] ${symbol} — $${lastClose.toFixed(
            2
          )} | RSI ${R.toFixed(1)} | ${signal}`,
          progress: percent,
        });

        // บันทึกหุ้นที่เข้าเงื่อนไข Buy / Sell
        if (signal !== "Hold") {
          const item = {
            symbol,
            price: Number(lastClose.toFixed(2)),
            rsi: Number(R.toFixed(1)),
            signal,
            trend,
            date: new Date().toISOString(),
          };
          matches.push(item);
          fs.writeFileSync(SAVE_PATH, JSON.stringify(matches, null, 2));
          send({
            alert: `🎯 ${signal} — ${symbol} $${lastClose.toFixed(
              2
            )} | RSI ${R.toFixed(1)}`,
          });
        }

        await new Promise((r) => setTimeout(r, DELAY_MS));
      } catch (err) {
        send({ log: `⚠️ ${symbol} error: ${err.message}` });
      }
    }

    // เรียก batch ถัดไปอัตโนมัติ
    const next = batch + 1;
    const nextStart = (next - 1) * BATCH_SIZE;

    if (nextStart < total) {
      send({ log: `➡️ ดำเนินการต่อ batch ${next} ...`, nextBatch: true });
      setTimeout(async () => {
        await fetch(
          `${process.env.VERCEL_URL
            ? "https://" + process.env.VERCEL_URL
            : "http://localhost:3000"
          }/api/scan?batch=${next}`
        );
      }, 2000);
    } else {
      send({
        log: `✅ สแกนครบทั้งหมด ${total} ตัวเรียบร้อย!`,
        done: true,
      });
    }

    res.end();
  } catch (err) {
    send({ error: err.message });
    res.end();
  }
                 }
