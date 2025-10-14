// ฟรี: ใช้ Google News RSS + heuristic sentiment
export const config = { runtime: "nodejs" };

const FEEDS = [
  "https://news.google.com/rss/search?q=AI%20OR%20GPU%20OR%20NVIDIA%20finance&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=partnership%20OR%20contract%20site:prnewswire.com&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=expansion%20OR%20capacity%20site:globenewswire.com&hl=en-US&gl=US&ceid=US:en",
];

const POS = ["beats","surge","record","expand","partnership","win","contract","profit","upgrade","acceleration","ramp","milestone","deploy","award","approved"];
const NEG = ["miss","delay","downgrade","cut","probe","lawsuit","halt","recall","guidance down","shortfall","investigation","layoff"];

function scoreSentiment(text=""){
  const t = text.toLowerCase();
  let s = 0;
  for (const w of POS) if (t.includes(w)) s += 1;
  for (const w of NEG) if (t.includes(w)) s -= 1;
  // normalize -2..2
  return Math.max(-2, Math.min(2, s));
}

function tryExtractSymbol(title=""){
  // แบบง่าย: ดึงคำที่เป็นอักษรใหญ่ 1–5 ตัว เช่น NVDA, BTDR, IREN
  const m = title.match(/\b[A-Z]{1,5}\b/g);
  if (!m) return null;
  // ตัดคำทั่วไป
  const bad = new Set(["FOR","AND","THE","WITH","FROM","WILL","THIS","NEWS"]);
  const cand = m.filter(x => !bad.has(x));
  return cand.length ? cand[0] : null;
}

async function fetchFeed(url){
  const r = await fetch(url, { headers:{ "User-Agent":"Mozilla/5.0" }});
  const xml = await r.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>m[1]);
  return items.map(raw=>{
    const title = (raw.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g,"");
    const link  = raw.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const pub   = raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const symbol = tryExtractSymbol(title);
    const s = scoreSentiment(title);
    return { title, link, publishedAt: pub, symbol, sentiment: s };
  });
}

export default async function handler(req,res){
  try{
    const all = (await Promise.all(FEEDS.map(fetchFeed))).flat()
      .filter(x=>x.symbol) // ต้องมีสัญลักษณ์
      .map(x=>({ ...x, freshnessMin: Math.max(0, (Date.now()-Date.parse(x.publishedAt))/60000) }))
      .sort((a,b)=>a.freshnessMin - b.freshnessMin) // ใหม่ก่อน
      .slice(0,60);

    res.setHeader("Cache-Control","public, s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({ results: all });
  }catch(e){
    res.status(500).json({ error: e?.message || "news failed" });
  }
  }
