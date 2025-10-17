// ✅ /pages/api/scan.js — Full Market Scan with Live Progress + Alerts
import { ema, rsi, macd } from "../../lib/indicators.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");

  const encoder = new TextEncoder();
  const send = (msg) => res.write(encoder.encode(`${JSON.stringify(msg)}\n`));

  try {
    send({ log: "🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..." });
    send({ log: "📦 กำลังโหลดรายชื่อหุ้นทั้งหมด..." });

    // ✅ โหลดรายชื่อหุ้นทั้งหมดจาก 3 ตลาด
    const tickersRes = await fetch(
      "https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE,AMEX"
    );
    const tickers = await tickersRes.json();
    const symbols = tickers.map((x) => x.ticker).slice(0, 6000);
    send({ log: `✅ โหลดรายชื่อหุ้นทั้งหมด ${symbols.length} ตัวสำเร็จ` });

    const results = [];
    let count = 0;
    const total = symbols.length;

    for (const symbol of symbols) {
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

        // ✅ แจ้งเตือนเมื่อเข้าเงื่อนไข (Buy หรือ Sell)
        if (signal !== "Hold") {
          send({
            alert: `🎯 ${signal} — ${symbol} $${lastClose.toFixed(2)} | RSI ${R.toFixed(
              1
            )}`,
          });
        }

        // ✅ แสดงหุ้นที่กำลังสแกน
        const percent = ((count / total) * 100).toFixed(1);
        send({
          log: `🔍 [${percent}%] ${symbol} — $${lastClose.toFixed(
            2
          )} | RSI ${R.toFixed(1)} | ${signal}`,
          progress: percent,
        });

        results.push(stock);
        await new Promise((r) => setTimeout(r, 150)); // ป้องกันโดน block
      } catch (err) {
        send({ log: `⚠️ ${symbol} error: ${err.message}` });
      }
    }

    // ✅ สรุปสุดท้าย
    const found = results.filter((x) => x.signal !== "Hold");
    send({
      log: `✅ สแกนเสร็จสิ้นทั้งหมด ${results.length} ตัว | พบหุ้นเข้าเงื่อนไข ${found.length} ตัว`,
      found: found.length,
      results: found,
    });

    res.end();
  } catch (err) {
    send({ error: err.message });
    res.end();
  }
      }
