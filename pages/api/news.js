// ✅ /pages/api/news2.js
const FEEDS = [
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^IXIC,NVDA,TSLA,AMD,MSFT,AAPL,META&region=US&lang=en-US",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "https://www.marketwatch.com/rss/topstories"
];

const POS = ["surge","soar","jump","beat","record","rally","gain","grow","bull","upgrade","approve","profitable","tops","better than"];
const NEG = ["plunge","drop","fall","miss","slash","downgrade","lawsuit","probe","ban","shortfall","loss","cut","recall","worse than","bankrupt","default"];

const strip = (s="") => s.replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<\/?[^>]+>/g,"").trim();
const timeISO = s => { const d=new Date(s||Date.now()); return isNaN(d)?new Date().toISOString():d.toISOString(); };
const uniqBy = (arr,key)=>{const seen=new Set();return arr.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true;});};
const detectSentiment=t=>{const L=t.toLowerCase();let s=0;POS.forEach(w=>L.includes(w)&&s++);NEG.forEach(w=>L.includes(w)&&s--);return s>0?"Positive":s<0?"Negative":"Neutral";};
const extractTickers=title=>{const S=new Set();[...title.matchAll(/\$([A-Z]{1,6})\b/g),...title.matchAll(/\b([A-Z]{1,5})\b(?=\s+(stock|shares|surges|falls))/gi)].forEach(m=>{const t=m[1];if(t&&t.length<=6)S.add(t.toUpperCase());});return [...S];};

async function fetchRSS(url){
  try{
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"}});
    const xml=await r.text();
    const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{
      const b=m[1],g=t=>strip((b.match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`))||[])[1]||"");
      const title=g("title"),link=g("link")||g("guid"),date=g("pubDate");
      return{title,url:link,date:timeISO(date)};
    });
    const src=url.includes("yahoo")?"Yahoo Finance":url.includes("cnbc")?"CNBC":url.includes("marketwatch")?"MarketWatch":"Unknown";
    return items.map(it=>({...it,source:src,sentiment:detectSentiment(it.title),symbols:extractTickers(it.title)}));
  }catch{return[];}
}

export default async function handler(req,res){
  try{
    const sym=String(req.query.symbol||"").toUpperCase();
    let all=(await Promise.all(FEEDS.map(fetchRSS))).flat().sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(sym) all=all.filter(x=>x.symbols.includes(sym));
    all=uniqBy(all,x=>`${x.title}|${x.source}`);
    res.status(200).json({results:all.slice(0,100)});
  }catch(e){res.status(500).json({results:[],error:e.message});}
}
