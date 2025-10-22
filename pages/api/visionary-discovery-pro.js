// ✅ Visionary Discovery Pro (Full Scan Edition)
// สแกนทั้งตลาด 7,000 ตัวทีละ 10 ตัว + จำหุ้นถาวร 30 ตัวที่ดีที่สุด

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
try {
const BATCH_SIZE = 10;
const STORAGE_PATH = path.join(process.cwd(), "public", "ai-portfolio.json");

// โหลดพอร์ตเดิม  
let oldPortfolio = [];  
try {  
  if (fs.existsSync(STORAGE_PATH)) {  
    oldPortfolio = JSON.parse(fs.readFileSync(STORAGE_PATH, "utf8") || "[]");  
  }  
} catch {  
  oldPortfolio = [];  
}  

// โหลดรายชื่อหุ้น  
const stockSources = [  
  "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",  
  "https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv",  
  "https://datahub.io/core/amex-listings/r/amex-listed.csv",  
];  

let allSymbols = [];  
for (const src of stockSources) {  
  try {  
    const raw = await fetch(src).then((r) => r.text());  
    const list = raw  
      .split("\n")  
      .map((l) => l.split(",")[0].trim())  
      .filter((s) => /^[A-Z.]+$/.test(s));  
    allSymbols.push(...list);  
  } catch {}  
}  

allSymbols = [...new Set(allSymbols)].slice(0, 7000);  

// อ่าน index ล่าสุด  
const indexFile = path.join(process.cwd(), "public", "ai-scan-index.json");  
let lastIndex = 0;  
try {  
  if (fs.existsSync(indexFile)) {  
    lastIndex = JSON.parse(fs.readFileSync(indexFile, "utf8")).index || 0;  
  }  
} catch {}  

// ดึงชุดต่อไป  
const nextBatch = allSymbols.slice(lastIndex, lastIndex + BATCH_SIZE);  

// เครื่องมือคำนวณ  
const EMA = (arr, p) => {  
  if (!arr?.length) return null;  
  const k = 2 / (p + 1);  
  let e = arr[0];  
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);  
  return e;  
};  

const RSI = (arr, n = 14) => {  
  if (!arr || arr.length < n + 1) return 50;  
  let g = 0, l = 0;  
  for (let i = 1; i <= n; i++) {  
    const d = arr[i] - arr[i - 1];  
    if (d >= 0) g += d; else l -= d;  
  }  
  const rs = g / (l || 1);  
  return 100 - 100 / (1 + rs);  
};  

const newsSentiment = async (sym) => {  
  try {  
    const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);  
    const j = await r.json();  
    const items = (j.news || []).slice(0, 5);  
    let score = 0;  
    for (const n of items) {  
      const t = `${n.title || ""} ${n.summary || ""}`.toLowerCase();  
      if (/(ai|growth|record|expand|beat|contract|partnership|upgrade)/.test(t)) score += 2;  
      if (/(fraud|lawsuit|miss|cut|layoff|downgrade|probe|decline)/.test(t)) score -= 2;  
    }  
    return score;  
  } catch {  
    return 0;  
  }  
};  

const getChart = async (sym) => {  
  try {  
    const r = await fetch(  
      `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`  
    );  
    const j = await r.json();  
    return j.chart?.result?.[0];  
  } catch {  
    return null;  
  }  
};  

// เริ่มสแกน batch  
const batchResults = [];  
for (const sym of nextBatch) {  
  try {  
    const d = await getChart(sym);  
    const q = d?.indicators?.quote?.[0];  
    const closes = q?.close?.filter((x) => typeof x === "number");  
    if (!closes?.length) continue;  

    const last = closes.at(-1);  
    const ema20 = EMA(closes, 20);  
    const ema50 = EMA(closes, 50);  
    const rsi = RSI(closes);  
    const sentiment = await newsSentiment(sym);  

    if (last > 35 || ema20 <= ema50 || rsi < 45 || rsi > 80 || sentiment <= 0) continue;  

    const aiScore = Math.round((rsi - 45) * 2 + sentiment * 5);  

    batchResults.push({  
      symbol: sym,  
      price: Number(last.toFixed(2)),  
      ema20: Number(ema20.toFixed(2)),  
      ema50: Number(ema50.toFixed(2)),  
      rsi: Math.round(rsi),  
      sentiment,  
      aiScore,  
      reason: "AI พบแนวโน้มต้นน้ำ + ข่าวบวกต่อเนื่อง",  
      updated: new Date().toISOString(),  
    });  
  } catch {}  
  await new Promise((r) => setTimeout(r, 25));  
}  

// รวมกับพอร์ตเดิม  
const combined = [...oldPortfolio, ...batchResults];  
const unique = combined.reduce((acc, cur) => {  
  const exist = acc.find((x) => x.symbol === cur.symbol);  
  if (!exist) acc.push(cur);  
  else if (cur.aiScore > exist.aiScore) {  
    const idx = acc.findIndex((x) => x.symbol === cur.symbol);  
    acc[idx] = cur;  
  }  
  return acc;  
}, []);  

const top30 = unique.sort((a, b) => b.aiScore - a.aiScore).slice(0, 30);  

// บันทึกผล  
fs.writeFileSync(STORAGE_PATH, JSON.stringify(top30, null, 2), "utf8");  
fs.writeFileSync(indexFile, JSON.stringify({ index: lastIndex + BATCH_SIZE }), "utf8");  

res.status(200).json({  
  success: true,  
  scanned: nextBatch.length,  
  progress: `${lastIndex + BATCH_SIZE}/${allSymbols.length}`,  
  discovered: top30,  
});

} catch (err) {
res.status(500).json({ error: err.message });
}
}     
