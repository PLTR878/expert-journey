// ✅ /pages/analyze/[symbol].js — Visionary Analyzer Final (Stock + Option + AI Entry Guard)
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
  const [loading, setLoading] = useState(true);

  // ===== โหลดข้อมูลหุ้นหลัก =====
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const [infRes, optRes, coreRes, scanRes, newsRes] = await Promise.all([
          fetch(`/api/visionary-infinite-core?symbol=${symbol}`).then(r=>r.json()).catch(()=>null),
          fetch(`/api/visionary-option-ai?symbol=${symbol}`).then(r=>r.json()).catch(()=>null),
          fetch(`/api/visionary-core?symbol=${symbol}`).then(r=>r.json()).catch(()=>null),
          fetch(`/api/visionary-scanner?symbol=${symbol}`).then(r=>r.json()).catch(()=>null),
          fetch(`/api/news?symbol=${symbol}`).then(r=>r.json()).catch(()=>({items:[]}))
        ]);
        const base = infRes && !infRes.error ? infRes : coreRes;
        setCore(base);
        setScanner(scanRes);
        setOptionAI(optRes);
        setNews(base?.news || newsRes.items || []);
      } catch (e) {
        console.error("⚠️ Analyzer error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  const sig = computeSignal(core || {});
  const price = core?.lastClose || 0;
  const hist = core?.chart?.timestamps
    ? core.chart.timestamps.map((t, i) => ({
        time: t,
        open: core.chart.open?.[i],
        high: core.chart.high?.[i],
        low: core.chart.low?.[i],
        close: core.chart.prices?.[i],
        volume: core.chart.volume?.[i],
      }))
    : [];
  const markers = useMemo(() => {
    if (!hist.length) return [];
    const t = Math.floor((hist.at(-1)?.time || Date.now()) / 1000);
    if (sig.action === "Buy") return [{ time:t, position:"belowBar", color:"#22c55e", shape:"arrowUp", text:"BUY"}];
    if (sig.action === "Sell") return [{ time:t, position:"aboveBar", color:"#ef4444", shape:"arrowDown", text:"SELL"}];
    return [{ time:t, position:"inBar", color:"#eab308", shape:"circle", text:"HOLD"}];
  }, [JSON.stringify(sig), hist.length]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold">
      <div className="max-w-6xl mx-auto px-3 py-5 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button onClick={() => window.history.back()} className="text-[12px] bg-white/5 px-3 py-1 rounded border border-white/10 hover:bg-emerald-500/10">
            ← ย้อนกลับ
          </button>
          <h1 className="text-[14px] font-bold tracking-widest">{symbol}</h1>
          <div className="text-emerald-400 font-semibold text-[12px] border border-emerald-400/30 rounded px-2 py-0.5">
            ${fmt(price,2)}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0f172a]">
          <Chart candles={hist} markers={markers}/>
        </div>

        {/* Mode */}
        <div className="flex justify-center gap-2">
          <button onClick={()=>setMode("stock")} className={`px-3 py-1 rounded-md text-[12px] font-bold ${mode==="stock"?"bg-emerald-500/20 text-emerald-400":"bg-white/5 text-gray-400"}`}>หุ้นธรรมดา (Stock)</button>
          <button onClick={()=>setMode("option")} className={`px-3 py-1 rounded-md text-[12px] font-bold ${mode==="option"?"bg-pink-500/20 text-pink-400":"bg-white/5 text-gray-400"}`}>ออปชั่น (Option)</button>
        </div>

        <AISignalSection ind={core} sig={sig} price={price} scanner={scanner} optionAI={optionAI} mode={mode}/>
        <MarketNews news={news}/>
      </div>
    </main>
  );
}

// ===== Logic =====
function computeSignal({ lastClose, ema20, ema50, ema200, rsi, trend }) {
  if (![lastClose,ema20,ema50,ema200,rsi].every(Number.isFinite))
    return {action:"Hold",confidence:0.5,reason:"ข้อมูลไม่เพียงพอ"};
  let s=0;
  if(lastClose>ema20)s++; if(ema20>ema50)s++; if(ema50>ema200)s++; if(rsi>55)s++;
  if(trend==="Uptrend")s+=0.5; if(trend==="Downtrend")s-=0.5;
  if(s>=3)return{action:"Buy",confidence:90,reason:"แนวโน้มขาขึ้นแข็งแรง"};
  if(s<=1)return{action:"Sell",confidence:70,reason:"แรงขายกดดัน"};
  return{action:"Hold",confidence:50,reason:"สัญญาณเป็นกลาง"};
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#141b2d] p-1.5 text-center">
      <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-[12px] font-bold text-gray-100">{value}</div>
    </div>
  );
}

function AISignalSection({ ind, sig, price, scanner, optionAI, mode }) {
  const baseConf = scanner?.confidence ?? sig.confidence*100;
  const rsi = ind?.rsi ?? 0;
  const target = scanner?.targetPrice ?? price*1.08;
  const reason = scanner?.reason || sig.reason;
  const showOption = mode==="option";
  const action = showOption ? optionAI?.signal || sig.action : sig.action;
  const conf = showOption ? optionAI?.confidence || baseConf : baseConf;
  const call = optionAI?.topCall || {strike:"-",premium:"-",roi:"-"};
  const put = optionAI?.topPut || {strike:"-",premium:"-",roi:"-"};

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3 space-y-3 shadow-inner">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[13px] font-bold tracking-widest">AI {showOption?"Option":"Trade"} Signal</h2>
        <span className={`font-bold ${action==="Buy"?"text-green-400":action==="Sell"?"text-red-400":"text-yellow-300"}`}>{action}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[12px]">
        <Info label="🎯 Target" value={`$${fmt(optionAI?.target||target,2)}`}/>
        <Info label="🤖 Confidence" value={`${fmt(conf,0)}%`}/>
        <Info label="📋 Reason" value={optionAI?.reason||reason}/>
        <Info label="RSI (14)" value={fmt(rsi,1)}/>
      </div>

      {/* EMA */}
      <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-2">
        <h3 className="text-emerald-400 font-semibold mb-1 text-[11px]">EMA Overview</h3>
        <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center">
          <Info label="Last" value={`$${fmt(ind?.lastClose)}`}/>
          <Info label="EMA20" value={fmt(ind?.ema20)}/>
          <Info label="EMA50" value={fmt(ind?.ema50)}/>
          <Info label="EMA200" value={fmt(ind?.ema200)}/>
        </div>
      </div>

      {/* ✅ Option Summary + Entry Guard */}
      {showOption && <OptionSimulator call={call}/>}

      {/* ✅ AI Entry Zone */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-2 text-[11px] space-y-1">
        <div className="text-emerald-400 font-bold text-[12px]">AI Entry Zone</div>
        {rsi<40?"🔵 Oversold — รอการกลับตัว":rsi<=60?"🟢 โซนเข้าซื้อแนะนำ":rsi<=70?"🟡 ถือรอดูแรงซื้อต่อเนื่อง":"🔴 Overbought — อย่าเพิ่งเข้า"}
        <div className="mt-2 h-1.5 w-full bg-[#1e293b] rounded-full overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{width:`${Math.min(Math.max(rsi,0),100)}%`,background:rsi<40?"#3b82f6":rsi<=60?"#22c55e":rsi<=70?"#eab308":"#ef4444"}}/>
        </div>
      </div>
    </section>
  );
}

function OptionSimulator({ call }) {
  const [delta,setDelta]=useState(0.2);
  const [theta,setTheta]=useState(-0.008);
  const [move,setMove]=useState(1);
  const [days,setDays]=useState(3);
  const [base,setBase]=useState(call.premium||0.4);
  const [res,setRes]=useState(null);

  function simulate(){
    const result = base + delta*move + theta*days;
    const diff = ((result-base)/base)*100;
    setRes({price:result,diff});
  }

  return (
    <div className="bg-[#131c2d] rounded-xl border border-pink-500/20 p-2 space-y-2">
      <h3 className="text-pink-400 font-bold text-[12px] mb-1 tracking-wider">Option Entry Guard</h3>
      <div className="grid grid-cols-2 gap-1.5 text-[12px]">
        <input type="number" step="0.01" value={delta} onChange={e=>setDelta(+e.target.value)} className="bg-[#1b2435] text-center p-1 rounded border border-white/10" placeholder="Δ Delta"/>
        <input type="number" step="0.001" value={theta} onChange={e=>setTheta(+e.target.value)} className="bg-[#1b2435] text-center p-1 rounded border border-white/10" placeholder="Θ Theta"/>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-[12px]">
        <input type="number" step="0.1" value={move} onChange={e=>setMove(+e.target.value)} className="bg-[#1b2435] text-center p-1 rounded border border-white/10" placeholder="หุ้นขึ้น ($)"/>
        <input type="number" step="1" value={days} onChange={e=>setDays(+e.target.value)} className="bg-[#1b2435] text-center p-1 rounded border border-white/10" placeholder="วันผ่านไป"/>
        <input type="number" step="0.01" value={base} onChange={e=>setBase(+e.target.value)} className="bg-[#1b2435] text-center p-1 rounded border border-white/10" placeholder="ราคา Option"/>
      </div>
      <button onClick={simulate} className="w-full py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded text-emerald-400 font-semibold text-[12px] hover:bg-emerald-500/30">🧮 คำนวณราคา</button>
      {res && (
        <div className={`text-center text-[12px] font-bold mt-1 ${res.diff>0?"text-emerald-400":res.diff<0?"text-red-400":"text-yellow-300"}`}>
          คาดว่า ≈ ${res.price.toFixed(2)} ({res.diff>0?"+":""}{res.diff.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

function MarketNews({ news }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3">
      <h2 className="text-[13px] font-bold mb-1 tracking-wide">Market News</h2>
      {!news?.length ? <div className="text-[11px] text-gray-400">No recent news.</div> :
        <ul className="space-y-1.5">
          {news.slice(0,8).map((n,i)=>(
            <li key={i} className="p-1.5 bg-black/20 border border-white/10 rounded-lg">
              <a href={n.link||n.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 text-[12px] font-medium">{n.title}</a>
              <div className="text-[10px] text-gray-400 mt-0.5">{n.publisher||n.source||""}</div>
            </li>
          ))}
        </ul>}
    </section>
  );
    }
