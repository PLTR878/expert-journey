// /pages/api/scan.js
import { rsi, ema, scoreSignal } from "../../lib/indicators";

export const config = { runtime: "edge" };

const Y_URL = (s) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    s
  )}?range=6mo&interval=1d`;

async function getCloses(symbol) {
  const r = await fetch(Y_URL(symbol), { cache: "no-store" });
  if (!r.ok) throw new Error("yahoo fail");
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  if (!res?.indicators?.quote?.[0]?.close) throw new Error("no data");
  return res.indicators.quote[0].close.filter((x) => typeof x === "number");
}

// จำกัดความพร้อมกัน (concurrency) เพื่อเลี่ยง rate-limit
async function mapLimit(items, limit, fn) {
  const ret = [];
  let i = 0;
  const workers = Array.from({ length: limit }).map(async () => {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return ret;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const offset = Number(searchParams.get("offset") || 0);
    const limit = Math.min(Number(searchParams.get("limit") || 120), 200);

    // 1) รายชื่อทั้งหมด
    const { symbols, total } = await fetch(
      `${new URL(req.url).origin}/api/symbols`,
      { cache: "no-store" }
    ).then((r) => r.json());

    const slice = symbols.slice(offset, offset + limit);

    // 2) ดึงราคา + คำนวณอินดี้
    const rows = await mapLimit(slice, 8, async (sym) => {
      try {
        const closes = await getCloses(sym);
        if (closes.length < 50) return null;

        const rsi14 = rsi(closes, 14);
        const ema20 = ema(closes, 20).at(-1);
        const ema50 = ema(closes, 50).at(-1);
        const ema200 = ema(closes, 200).at(-1);
        const c = closes.at(-1);

        // เงื่อนไข Buy 1–7 วัน (ปรับได้)
        const ok =
          rsi14 != null &&
          rsi14 >= 35 &&
          rsi14 <= 60 &&
          c > ema20 &&
          ema20 >= ema50 * 0.98; // ไม่แพ้ทางมาก

        if (!ok) return null;

        const score = scoreSignal({ c, ema20, ema50, ema200, rsi14 });
        return {
          symbol: sym,
          price: Number(c.toFixed(2)),
          rsi: Number(rsi14.toFixed(1)),
          ema20: Number(ema20.toFixed(2)),
          ema50: Number(ema50.toFixed(2)),
          ema200: Number(ema200.toFixed(2)),
          score,
        };
      } catch {
        return null;
      }
    });

    // 3) คัดเฉพาะที่ผ่าน + จัดอันดับ Top 10 ของแบตช์
    const passed = rows.filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 10);

    return new Response(
      JSON.stringify({
        batch: { offset, limit, scanned: Math.min(offset + limit, total), total },
        top10: passed,
      }),
      {
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
          }
