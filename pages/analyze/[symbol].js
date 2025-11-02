// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Stock + Option + AI Entry Zone + Option Simulator Lite)
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("../../components/Chart.js"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

export default function Analyze() {
  const { query } = useRouter();
  const symbol = (query.symbol || "").toString().toUpperCase();
  const [core, setCore] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [optionAI, setOptionAI] = useState(null);
  const [news, setNews] = useState([]);
  const [mode, setMode] = useState("stock");

  useEffect(() => {
    if (!symbol) return;
    (async () => {
      try {
        const [a, b, c] = await Promise.allSettled([
          fetch(`/api/visionary-infinite-core?symbol=${symbol}`).then(r=>r.json()),
          fetch(`/api/visionary-option-ai?symbol=${symbol}`).then(r=>r.json()),
          fetch(`/api/news?symbol=${symbol}`).then(r=>r.json())
        ]);
        const inf = a.value, opt = b.value, nws = c.value;
        setCore(inf?.symbol ? inf : await fetch(`/api/visionary-core?symbol=${symbol}`).then(r=>r.json()));
        setScanner({ targetPrice: inf?.lastClose*1.08, confidence: inf?.confidence, reason: inf?.reason });
        setOptionAI(opt); setNews(nws?.items||[]);
      } catch(e){ console.error(e); }
    })();
  }, [symbol]);

  const sig = computeSignal(core || {}), price = core?.lastClose || 0;
  const hist = core?.chart?.timestamps?.map((t,i)=>({time:t,open:core.chart.open[i],high:core.chart.high[i],low:core.chart.low[i],close:core.chart.prices[i],volume:core.chart.volume[i]}))||[];
  const markers = useMemo(()=>{
    const t = Math.floor((hist.at(-1)?.time||Date.now())/1000);
    const color = sig.action==="Buy"?"#22c55e":sig.action==="Sell"?"#ef4444":"#eab308";
    const shape = sig.action==="Buy"?"arrowUp":sig.action==="Sell"?"arrowDown":"circle";
    return [{time:t,position:"belowBar",color,shape,text:sig.action.toUpperCase()}];
  },[sig.action,hist]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold">
      <div className="max-w-6xl mx-auto px-3 py-5 space-y-5">
        <Header symbol={symbol} price={price}/>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] overflow-hidden"><Chart candles={hist} markers={markers}/></div>
        <Toggle mode={mode} setMode={setMode}/>
        <AISignalSection ind={core} sig={sig} price={price} scanner={scanner} optionAI={optionAI} mode={mode}/>
        <MarketNews news={news}/>
      </div>
    </main>
  );
}

const Header=({symbol,price})=>(
  <div className="flex justify-between items-center">
    <button onClick={()=>window.history.back()} className="text-[12px] bg-white/5 px-3 py-1 rounded border border-white/10 hover:bg-emerald-500/10">← ย้อนกลับ</button>
    <h1 className="text-[14px] font-bold tracking-widest">{symbol}</h1>
    <div className="text-emerald-400 text-[12px] border border-emerald-400/30 rounded px-2 py-0.5">${fmt(price,2)}</div>
  </div>
);
const Toggle=({mode,setMode})=>(
  <div className="flex justify-center gap-2">
    {["stock","option"].map(t=>(
      <button key={t} onClick={()=>setMode(t)} className={`px-3 py-1 rounded-md text-[12px] font-bold ${mode===t?(t==="stock"?"bg-emerald-500/20 text-emerald-400":"bg-pink-500/20 text-pink-400"):"bg-white/5 text-gray-400"}`}>{t==="stock"?"หุ้นธรรมดา (Stock)":"ออปชั่น (Option)"}</button>
    ))}
  </div>
);

function computeSignal({ lastClose, ema20, ema50, ema200, rsi, trend }) {
  if (![lastClose, ema20, ema50, ema200, rsi].every(Number.isFinite)) return {action:"Hold",confidence:50,reason:"ข้อมูลไม่เพียงพอ"};
  let s=0;if(lastClose>ema20)s++;if(ema20>ema50)s++;if(ema50>ema200)s++;if(rsi>55)s++;if(trend==="Uptrend")s+=.5;if(trend==="Downtrend")s-=.5;
  return s>=3?{action:"Buy",confidence:90,reason:"แนวโน้มขาขึ้น"}:s<=1?{action:"Sell",confidence:70,reason:"แรงขาย"}:{action:"Hold",confidence:50,reason:"กลาง"};
}
const Info=({label,value})=><div className="rounded-lg border border-white/10 bg-[#141b2d] p-1.5 text-center"><div className="text-[11px] text-gray-400">{label}</div><div className="text-[12px] font-bold">{value}</div></div>;

function AISignalSection({ ind, sig, price, scanner, optionAI, mode }) {
  const rsi = ind?.rsi ?? 0, target = scanner?.targetPrice ?? price * 1.08, show = mode === "option";
  const act = show ? optionAI?.signal || sig.action : sig.action, conf = show ? optionAI?.confidence || scanner?.confidence : scanner?.confidence;
  const call = optionAI?.topCall || {}, put = optionAI?.topPut || {};
  const [delta,setDelta]=useState(optionAI?.delta||0.2),[theta,setTheta]=useState(optionAI?.theta||-0.008),[result,setResult]=useState(null);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[13px] font-bold">AI {show?"Option":"Trade"} Signal</h2>
        <span className={`font-bold ${act==="Buy"?"text-green-400":act==="Sell"?"text-red-400":"text-yellow-300"}`}>{act}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[12px]">
        <Info label="🎯 Target" value={`$${fmt(optionAI?.target||target,2)}`}/>
        <Info label="🤖 Confidence" value={`${fmt(conf,0)}%`}/>
        <Info label="📋 Reason" value={optionAI?.reason||sig.reason}/>
        <Info label="RSI (14)" value={fmt(rsi,1)}/>
      </div>

      {/* Option Summary */}
      {show && (
        <>
        <div className="bg-[#131c2d] rounded-xl border border-pink-500/20 p-2">
          <h3 className="text-pink-400 font-bold text-[12px] mb-1">Option Summary</h3>
          <div className="grid grid-cols-2 gap-1.5">
            <Info label="Strike" value={`$${call.strike||"-"}`}/>
            <Info label="Premium" value={`$${call.premium||"-"}`}/>
            <Info label="ROI" value={`+${call.roi||0}%`}/>
            <Info label="Put ROI" value={`+${put.roi||0}%`}/>
          </div>
        </div>

        {/* Option Simulator */}
        <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-3 text-[12px]">
          <h3 className="text-emerald-400 font-bold mb-1">Option Simulator (Δ + Θ)</h3>
          <div className="grid grid-cols-2 gap-1 mb-1">
            <input type="number" step="0.01" value={delta} onChange={e=>setDelta(+e.target.value)} className="bg-[#1b2435] rounded p-1 text-center" placeholder="Δ Delta"/>
            <input type="number" step="0.001" value={theta} onChange={e=>setTheta(+e.target.value)} className="bg-[#1b2435] rounded p-1 text-center" placeholder="Θ Theta"/>
          </div>
          <button onClick={()=>{
            const base=call.premium||0.4,res=base+delta*1+theta*3;
            setResult({val:res.toFixed(2),chg:(((res-base)/base)*100).toFixed(1)});
          }} className="w-full py-1 bg-emerald-500/20 border border-emerald-400/30 rounded text-emerald-400">🧮 คำนวณราคา Option</button>
          {result && <p className="text-center text-[11px] mt-1 text-gray-300">คาดว่า ≈ ${result.val} ({result.chg}%)</p>}
        </div>
        </>
      )}

      {/* Entry Zone */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-2 text-[11px]">
        <div className="text-emerald-400 font-bold text-[12px]">AI Entry Zone</div>
        {rsi<40?"🔵 Oversold":rsi<=60?"🟢 เข้าซื้อ":rsi<=70?"🟡 ถือรอดู": "🔴 Overbought"}
        <div className="mt-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <div className="h-1.5 rounded-full" style={{width:`${rsi}%`,background:rsi<40?"#3b82f6":rsi<=60?"#22c55e":rsi<=70?"#eab308":"#ef4444"}}/>
        </div>
      </div>
    </section>
  );
}

const MarketNews=({news})=>(
  <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3">
    <h2 className="text-[13px] font-bold mb-1">Market News</h2>
    {!news?.length?<div className="text-[11px] text-gray-400">No news.</div>:(
      <ul className="space-y-1.5">{news.slice(0,8).map((n,i)=>(
        <li key={i} className="p-1.5 bg-black/20 border border-white/10 rounded-lg">
          <a href={n.link||n.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 text-[12px]">{n.title}</a>
          <div className="text-[10px] text-gray-400">{n.source}</div>
        </li>
      ))}</ul>
    )}
  </section>
);
