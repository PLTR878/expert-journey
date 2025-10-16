import { useEffect, useState } from "react";

export default function AlertSystem() {
  const [alerts, setAlerts] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("price_above");
  const [value, setValue] = useState("");
  const [toasts, setToasts] = useState([]);

  useEffect(()=>{ const s=localStorage.getItem("alerts"); if(s) setAlerts(JSON.parse(s)); },[]);
  useEffect(()=>{ localStorage.setItem("alerts", JSON.stringify(alerts)); },[alerts]);

  useEffect(()=>{
    const beep=()=>{ try{ const c=new (window.AudioContext||window.webkitAudioContext)(); const o=c.createOscillator(); o.type="square"; o.frequency.value=880; o.connect(c.destination); o.start(); setTimeout(()=>{o.stop(); c.close();},200);}catch{} };
    const check=async()=>{
      for (const a of alerts) {
        try {
          const r = await fetch(`/api/price?symbol=${encodeURIComponent(a.symbol)}`); const j = await r.json();
          const price = j.price ?? 0; const rsi = j.rsi ?? 50;
          let hit=false;
          if (a.type==="price_above" && price>a.value) hit=true;
          if (a.type==="price_below" && price<a.value) hit=true;
          if (a.type==="rsi_above" && rsi>a.value) hit=true;
          if (a.type==="rsi_below" && rsi<a.value) hit=true;
          if (hit){ const text=`⚡ ${a.symbol} ${a.type.replace("_"," ")} ${a.value} (now $${price})`; setToasts(p=>[...p,{id:Date.now(),text}]); beep(); }
        } catch {}
      }
    };
    check(); const id=setInterval(check,60*1000); return()=>clearInterval(id);
  },[alerts]);

  useEffect(()=>{ if(!toasts.length) return; const ids=toasts.map(t=>setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==t.id)),6000)); return()=>ids.forEach(clearTimeout); },[toasts]);

  const add=()=>{
    if (!symbol || !value) return alert("กรอก Symbol และ Value");
    setAlerts(p=>[...p,{ id:Date.now(), symbol:symbol.toUpperCase(), type, value:Number(value) }]);
    setSymbol(""); setValue("");
  };

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 border border-emerald-400/30">
      <h2 className="text-emerald-400 text-lg font-semibold mb-2">🔔 Stock Alerts</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <input className="bg-[#141b2d] px-2 py-1 rounded w-28" placeholder="Symbol" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/>
        <select className="bg-[#141b2d] px-2 py-1 rounded" value={type} onChange={e=>setType(e.target.value)}>
          <option value="price_above">Price &gt;</option><option value="price_below">Price &lt;</option>
          <option value="rsi_above">RSI &gt;</option><option value="rsi_below">RSI &lt;</option>
        </select>
        <input className="bg-[#141b2d] px-2 py-1 rounded w-24" placeholder="Value" value={value} onChange={e=>setValue(e.target.value)}/>
        <button onClick={add} className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-1 text-emerald-300">➕ Add</button>
      </div>

      <ul className="space-y-2">
        {alerts.length?alerts.map(a=>(
          <li key={a.id} className="flex justify-between items-center bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2 text-sm">
            <span className="text-emerald-200">{a.symbol} — {a.type.replace("_"," ")} {a.value}</span>
            <button onClick={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))} className="text-red-400 hover:text-red-300 text-xs underline">Remove</button>
          </li>
        )):<div className="text-gray-400">ยังไม่มีแจ้งเตือน</div>}
      </ul>

      <div className="fixed top-16 right-4 space-y-2 z-50">
        {toasts.map(t=>(
          <div key={t.id} className="bg-[#101827]/90 border border-emerald-400/30 text-emerald-200 px-3 py-2 rounded shadow">{t.text}</div>
        ))}
      </div>
    </section>
  );
      }
