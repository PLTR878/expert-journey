// ✅ /pages/api/scan.js (Stable Market Scanner)
// ใช้ Yahoo Finance API ตรง + ป้องกัน JSON error
// แสดง progress / log แบบเวอร์ชันเก่า

import { ema, rsi, macd } from "../../lib/indicators.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");

  const encoder = new TextEncoder();
  const send = (msg) => res.write(encoder.encode(`${JSON.stringify(msg)}\n`));

  try {
    send({ log: "🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..." });

    // โหลดรายชื่อหุ้นทั้งหมด
    send({ log: "📦 กำลังโหลดรายชื่อหุ้นทั้งหมด..." });
    const tickersRes = await fetch(
      "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX"
    );
    const tickers = await tickersRes.json();
    const symbols = tickers.map((x) => x.ticker).slice(0, 6000);
    send({ log: `✅ โหลดรายชื่อหุ้นทั้งหมด ${symbols.length} ตัวสำเร็จ` });

    const results = [];
    let count = 0;

    for (const symbol of symbols) {
      count++;
      try {
        // ใช้ Yahoo API โดยตรง
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const text = await r.text();

        // ตรวจว่าเป็น JSON จริงไหม
        if (!text.startsWith("{")) {
          send({ log: `⚠️ ${symbol} — response ไม่ใช่ JSON, ข้าม` });
          continue;
        }

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

        results.push({
          symbol,
          lastClose: Number(lastClose.toFixed(2)),
          rsi: Number(R.toFixed(1)),
          trend,
          signal,
        });

        // แสดง progress ทุกๆ 50 หุ้น
        if (count % 50 === 0) {
          const percent = ((count / symbols.length) * 100).toFixed(1);
          send({ progress: `${percent}%`, log: `📊 ดำเนินการ ${percent}%` });
        }

        // delay เล็กน้อยป้องกัน block
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        send({ log: `⚠️ ${symbol} error: ${err.message}` });
      }
    }

    send({
      log: `✅ สแกนเสร็จทั้งหมด ${results.length} ตัว`,
      total: results.length,
      results,
    });

    res.end();
  } catch (err) {
    send({ error: err.message });
    res.end();
  }
    }
