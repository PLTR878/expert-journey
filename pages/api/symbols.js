// /pages/api/symbols.js
export const config = { runtime: "edge" };

const SOURCES = [
  "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt",
  "https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt",
  // สำรอง (รวม NYSE/NASDAQ/AMEX) – กันล่ม
  "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/master/all/all_tickers.txt",
];

async function fetchText(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("fetch fail " + url);
  return r.text();
}

function parseSymbolsFromNasdaqTxt(txt) {
  // ไฟล์ nasdaq: header แถวแรก, คั่นด้วย |
  return txt
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split("|")[0]?.trim())
    .filter((s) => s && /^[A-Z.\-]+$/.test(s) && !s.includes("#"));
}

function parseSymbolsFromList(txt) {
  return txt
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && /^[A-Z.\-]+$/.test(s));
}

export default async function handler(req) {
  try {
    const [a, b, c] = await Promise.allSettled(SOURCES.map(fetchText));
    const all = new Set();

    if (a.status === "fulfilled") parseSymbolsFromNasdaqTxt(a.value).forEach((s) => all.add(s));
    if (b.status === "fulfilled") parseSymbolsFromNasdaqTxt(b.value).forEach((s) => all.add(s));
    if (c.status === "fulfilled") parseSymbolsFromList(c.value).forEach((s) => all.add(s));

    const arr = Array.from(all).filter((s) => !s.includes("^")).sort();

    return new Response(JSON.stringify({ total: arr.length, symbols: arr }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=900", // 15 นาที
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
