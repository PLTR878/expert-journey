// pages/api/news.js
// Aggregates multiple free RSS feeds, dedupes, tags tickers, adds lightweight sentiment.

const FEEDS = [
  // แหล่งฟรีและเสถียร
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^IXIC,NVDA,TSLA,AMD,MSFT,AAPL,META&region=US&lang=en-US",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html", // CNBC Top News & Analysis
  "https://www.marketwatch.com/rss/topstories"
];

// คีย์เวิร์ดเชิงบวก/ลบแบบง่าย ๆ
const POS = ["surge","soar","jump","beat","record","rally","gain","grow","bull","upgrade","approve","profitable","tops","better than"];
const NEG = ["plunge","drop","fall","miss","slash","downgrade","lawsuit","probe","ban","shortfall","loss","cut","recall","worse than","bankrupt","default"];

const strip = (s="") => s.replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<\/?[^>]+>/g,"").trim();
const timeISO = (s) => {
  const d = new Date(s || Date.now());
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};
const uniqBy = (arr, key) => {
  const seen = new Set();
  return arr.filter(x => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
const detectSentiment = (t="") => {
  const L = t.toLowerCase();
  let score = 0;
  POS.forEach(w=>{ if (L.includes(w)) score++; });
  NEG.forEach(w=>{ if (L.includes(w)) score--; });
  if (score > 0) return "Positive";
  if (score < 0) return "Negative";
  return "Neutral";
};
const extractTickers = (title="") => {
  // ดึง $NVDA / (NVDA) / NVDA: แบบง่าย
  const s = new Set();
  const r1 = [...title.matchAll(/\$([A-Z]{1,6})\b/g)].map(m=>m[1]);
  const r2 = [...title.matchAll(/\b([A-Z]{1,5})\b(?=\s+stock|\s+shares|\s+surges|\s+falls)/gi)].map(m=>m[1]);
  [...r1,...r2].forEach(t => { if (t && t.length>=2 && t.length<=6) s.add(t.toUpperCase()); });
  return [...s];
};

async function fetchRSS(url) {
  try {
    const r = await fetch(url, { cache:"no-store" });
    const xml = await r.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
      const block = m[1];
      const get = (tag) => strip((block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))||[])[1]||"");
      const title = get("title");
      const link = get("link") || get("guid");
      const pubDate = get("pubDate");
      return { title, url: link, date: timeISO(pubDate) };
    });
    let source = "Unknown";
    if (url.includes("yahoo")) source = "Yahoo Finance";
    if (url.includes("cnbc")) source = "CNBC";
    if (url.includes("marketwatch")) source = "MarketWatch";
    return items.map(it => ({
      ...it,
      source,
      sentiment: detectSentiment(it.title),
      symbols: extractTickers(it.title),
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const sym = String(req.query.symbol || "").trim().toUpperCase();
    const limit = Math.min(200, Number(req.query.limit || 80));

    const chunks = await Promise.all(FEEDS.map(fetchRSS));
    let all = chunks.flat();

    // จัดเรียงตามเวลาล่าสุด
    all.sort((a,b)=> new Date(b.date) - new Date(a.date));

    // กรองคำค้น/สัญลักษณ์ถ้ามี
    if (q) all = all.filter(x => x.title.toLowerCase().includes(q));
    if (sym) all = all.filter(x => x.symbols.includes(sym));

    // ตัดซ้ำตาม title + source
    all = uniqBy(all, x => `${x.title}|${x.source}`);

    res.status(200).json({ results: all.slice(0, limit) });
  } catch (e) {
    res.status(200).json({ results: [], error: e.message });
  }
}
