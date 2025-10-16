// ✅ AutoMarketScan.js — สแกนทั้งตลาดแบบสตรีม + Toast + Log
import { useEffect, useState } from "react";

export default function AutoMarketScan() {
  const [enabled, setEnabled] = useState(false);
  const [aiSignal, setAiSignal] = useState("Any");
  const [rsiMin, setRsiMin] = useState("");
  const [rsiMax, setRsiMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [prog, setProg] = useState(0);
  const [hits, setHits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "square"; osc.frequency.value = 880;
      osc.connect(ctx.destination); osc.start();
      setTimeout(()=>{osc.stop(); ctx.close();},200);
    } catch {}
  };

  const runScan = async () => {
    if (!enabled) return;
    setProg(0); setHits([]); setLogs(["🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..."]);
    const url = `/api/scan?mode=${aiSignal}&rsiMin=${rsiMin}&rsiMax=${rsiMax}&priceMin=${priceMin}&priceMax=${priceMax}`;
    const res = await fetch(url);
    if (!res.body) { setLogs(p=>[...p,"❌ ไม่สามารถเชื่อมต่อ API ได้"]); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream:true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const ln of lines) {
        if (!ln.trim()) continue;
        try {
          const j = JSON.parse(ln);
          if (j.log) setLogs(p=>[...p.slice(-80), j.log]);
          if (j.progress!=null) setProg(j.progress);
          if (j.hit) {
            setHits(p=>[...p, j.hit].slice(-40));
            beep();
            setToasts(p=>[...p, { id:Date.now(), text:`⚡ ${j.hit.symbol} | ${j.hit.ai} | RSI ${j.hit.rsi}` }]);
          }
        } catch {}
      }
    }
    setLogs(p=>[...p, "✅ เสร็จสิ้น"]);
    setProg(100);
  };

  // auto ทุก 5 นาที
  useEffect(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5*60*1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map(t => setTimeout(() => {
      setToasts(p=>p.filter(x=>x.id!==t.id));
    }, 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">🛰️ Auto Scan — US Stocks</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />
          <span className="text-emerald-300 font-semibold">Enable</span>
        </label>
        <select className="bg-[#141b2d] px-2 py-1 rounded" value={aiSignal} onChange={e=>setAiSignal(e.target.value)}>
          <option>Buy</option><option>Sell</option><option>Neutral</option><option>Any</option>
        </select>
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="RSI Min" value={rsiMin} onChange={e=>setRsiMin(e.target.value)} />
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="RSI Max" value={rsiMax} onChange={e=>setRsiMax(e.target.value)} />
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="Price Min" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="Price Max" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
        <button onClick={runScan} className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold">▶️ Run Now</button>
      </div>
      <div className="w-full bg-[#1a2335] h-2 rounded mt-1"><div className="bg-cyan-400 h-2 rounded transition-all" style={{width:`${prog}%`}}/></div>
      <div className="text-xs text-cyan-300 mt-1">Scanning... {prog}%</div>

      <div className="bg-[#0d1423]/60 p-2 mt-3 rounded text-[12px] text-gray-300 h-28 overflow-y-auto font-mono">
        {logs.map((l,i)=><div key={i}>{l}</div>)}
      </div>

      <div className="mt-3">
        <h3 className="text-cyan-200 text-sm font-semibold mb-1">Latest Matches ({hits.length})</h3>
        {hits.length?(
          <ul className="space-y-1">
            {hits.map((h,i)=>(
              <li key={i} className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-1.5">
                ⚡ {h.symbol} | {h.ai} | RSI={h.rsi} | ${h.price}
              </li>
            ))}
          </ul>
        ):<div className="text-gray-400 text-sm">ยังไม่พบหุ้นเข้าเงื่อนไข</div>}
      </div>

      <div className="fixed top-24 right-4 space-y-2 z-50">
        {toasts.map(t=>(
          <div key={t.id} className="bg-[#101827]/90 border border-cyan-400/40 text-cyan-100 px-3 py-2 rounded shadow">
            {t.text}
          </div>
        ))}
      </div>
    </section>
  );
                                                                                                     }
