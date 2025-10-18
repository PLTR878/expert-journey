// ✅ /pages/api/symbols.js
export const config = { runtime: "edge" };

const urls = [
  "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt",
  "https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt",
  "https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/master/all/all_tickers.txt",
];

async function getText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch fail " + url);
  return res.text();
}

function parseNasdaq(text) {
  return text
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split("|")[0])
    .filter((x) => /^[A-Z.\-]+$/.test(x));
}

export default async function handler() {
  try {
    const results = await Promise.allSettled(urls.map(getText));
    const set = new Set();

    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        const lines =
          i < 2 ? parseNasdaq(r.value) : r.value.split(/\r?\n/).filter(Boolean);
        lines.forEach((s) => set.add(s.trim()));
      }
    });

    const list = Array.from(set).filter((s) => !s.includes("^")).sort();

    return new Response(JSON.stringify({ total: list.length, symbols: list }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
