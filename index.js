// /pages/index.js
import { useEffect, useState } from 'react';

const DEFAULT_UNIVERSE=[]; // ตามที่ผู้ใช้ต้องการ: ว่างไว้ก่อน

export default function Home(){
  const [horizon,setHorizon]=useState('short');
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(false);
  const [symbols,setSymbols]=useState(DEFAULT_UNIVERSE.join(','));
  const [quotes,setQuotes]=useState({});
  const [theme,setTheme]=useState('system');

  function applyTheme(next){
    setTheme(next);
    const root=document.documentElement;
    if(next==='dark') root.classList.add('dark');
    else if(next==='light') root.classList.remove('dark');
    else { // system
      window.matchMedia('(prefers-color-scheme: dark)').matches ? root.classList.add('dark') : root.classList.remove('dark');
    }
  }

  async function run(){
    setLoading(true);
    try{
      const universe = symbols.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
      const body = { horizon, universe: universe.length? universe : undefined };
      const r=await fetch('/api/screener',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const j=await r.json(); setRows(j.results||[]);
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ applyTheme('system'); }, []);
  useEffect(()=>{ run(); }, [horizon]);

  useEffect(()=>{
    let t; async function poll(){
      const syms = (rows.length? rows.map(r=>r.symbol): []).slice(0,20);
      const m={}; await Promise.all(syms.map(async s=>{ try{ const q=await fetch(`/api/quote?symbol=${s}`).then(r=>r.json()); if(q?.price!=null) m[s]=q; }catch{} }));
      setQuotes(m);
    }
    poll(); t=setInterval(poll, 12000); return ()=> clearInterval(t);
  }, [rows.length]);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 bg-white/80 dark:bg-[#0b1220]/80 backdrop-blur border-b border-gray-200 dark:border-[#223355]">
        <div className="container flex items-center gap-3 py-2">
          <b className="text-lg">US AI Screener</b>
          <select value={horizon} onChange={e=>setHorizon(e.target.value)} className="btn">
            <option value="short">2–7 Days</option>
            <option value="medium">1–2 Months</option>
            <option value="long">10–20 Years</option>
          </select>
          <button onClick={run} className="btn">{loading? 'Scanning…':'Scan'}</button>
          <input value={symbols} onChange={e=>setSymbols(e.target.value)} placeholder="ใส่สัญลักษณ์ เช่น AAPL,NVDA" className="flex-1 btn" />
          <select value={theme} onChange={e=>applyTheme(e.target.value)} className="btn">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>

      <div className="container py-3 overflow-x-auto">
        <table className="min-w-[760px]">
          <thead><tr><th>Symbol</th><th>Score</th><th>Price</th><th>RSI</th><th>EMA20/50/200</th><th>Action</th></tr></thead>
          <tbody>
            {rows.length===0 && (
              <tr><td colSpan="6" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                ยังไม่มีรายการ — กรอกสัญลักษณ์ด้านบนแล้วกด Scan (ตัวอย่าง: AAPL,MSFT,NVDA)
              </td></tr>
            )}
            {rows.map(r=>{
              const q=quotes[r.symbol]; const price=q?.price??r.lastClose??'-'; const change=q?.changePct!=null? `${q.changePct.toFixed(2)}%`:'';
              return (
                <tr key={r.symbol}>
                  <td><a href={`/analyze/${r.symbol}`} className="link">{r.symbol}</a></td>
                  <td>{r.score!=null? r.score.toFixed(3):'-'}</td>
                  <td>{price} <small className={(q?.changePct||0)>=0? 'text-green-600':'text-red-600'}>{change}</small></td>
                  <td>{r.rsi? r.rsi.toFixed(1):'-'}</td>
                  <td>{[r.e20,r.e50,r.e200].map(x=>x?x.toFixed(2):'-').join(' / ')}</td>
                  <td><a className="text-gray-800 dark:text-gray-200" href={`/analyze/${r.symbol}`}>View</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
