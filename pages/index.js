import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort,setDataShort]=useState([]);
  const [dataMedium,setDataMedium]=useState([]);
  const [dataLong,setDataLong]=useState([]);
  const [hidden,setHidden]=useState([]);
  const [aiPicks,setAiPicks]=useState([]);
  const [newsTop,setNewsTop]=useState([]);
  const [symbolList,setSymbolList]=useState([]);
  const [favoritePrices,setFavoritePrices]=useState({});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [favorites,setFavorites]=useState([]);

  async function loadAll(){
    setLoading(true); setError("");
    try{
      const [s,m,l,h,a,news] = await Promise.all([
        fetch("/api/screener",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"short"})}).then(r=>r.json()),
        fetch("/api/screener",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"medium"})}).then(r=>r.json()),
        fetch("/api/screener",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({horizon:"long"})}).then(r=>r.json()).catch(()=>({results:[]})),
        fetch("/api/hidden-gems").then(r=>r.json()),
        fetch("/api/ai-picks").then(r=>r.json()),
        fetch("/api/news-intelligence-free").then(r=>r.json())
      ]);
      setDataShort(s.results||[]); setDataMedium(m.results||[]); setDataLong(l.results||[]);
      setHidden(h.results||[]); setAiPicks(a.results||[]);
      setNewsTop((news.results||[]).slice(0,8));
    }catch{ setError("โหลดข้อมูลไม่สำเร็จ"); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ loadAll(); },[]);
  useEffect(()=>{ const saved = localStorage.getItem("favorites"); if (saved) setFavorites(JSON.parse(saved)); },[]);
  useEffect(()=>{ localStorage.setItem("favorites", JSON.stringify(favorites)); },[favorites]);

  async function fetchYahooPrice(symbol){
    try{
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      if(!r.ok) return;
      const j = await r.json();
      setFavoritePrices(p=>({...p,[symbol]:{ price:Number(j.price)||0 }}));
    }catch{}
  }
  useEffect(()=>{ favorites.forEach(fetchYahooPrice); },[favorites]);

  // Search → เลื่อนขึ้นบน + ดึง symbol จาก Yahoo
  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(!search.trim()){ setSymbolList([]); return; }
      window.scrollTo({top:0,behavior:"smooth"});
      const res = await fetch(`/api/symbols?q=${encodeURIComponent(search)}`).then(r=>r.json()).catch(()=>({symbols:[]}));
      setSymbolList(res.symbols||[]);
    },500); return ()=>clearTimeout(t);
  },[search]);

  const toggleFavorite=(sym)=>setFavorites(p=>p.includes(sym)?p.filter(x=>x!==sym):[...p,sym]);

  // -------- UI helpers --------
  const Section = ({title, children}) => (
    <section className="max-w-6xl mx-auto px-4 my-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="rounded-2xl bg-[#101827]/70 p-0 shadow-sm">{children}</div>
    </section>
  );

  const Table = ({rows}) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse text-center">
        <thead className="sticky top-0 bg-[#0e1524] text-gray-400 uppercase text-[12px]">
          <tr>
            <th className="p-3 text-left pl-4">⭐</th>
            <th className="p-3">Symbol</th>
            <th className="p-3">Price</th>
            <th className="p-3">RSI</th>
            <th className="p-3">AI Signal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>{
            const isFav = favorites.includes(r.symbol);
            const p = favoritePrices[r.symbol];
            const priceText = p?.price ? `$${p.price.toFixed(2)}` :
              r.lastClose ? `$${Number(r.lastClose).toFixed(2)}` : "-";
            const sig = r.signal || "-";
            const color = sig==="Buy"?"text-green-400":sig==="Sell"?"text-red-400":"text-yellow-400";
            return (
              <tr key={r.symbol} className="hover:bg-white/5 transition">
                <td onClick={()=>toggleFavorite(r.symbol)} className="cursor-pointer pl-4 text-yellow-400">{isFav?"★":"☆"}</td>
                <td className="p-3 font-semibold text-sky-400"><a href={`/analyze/${r.symbol}`}>{r.symbol}</a></td>
                <td className="p-3 font-mono">{priceText}</td>
                <td className="p-3 text-gray-300">{typeof r.rsi==="number"?r.rsi.toFixed(1):"-"}</td>
                <td className={`p-3 font-semibold ${color}`}>{sig}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const mapSymbols = arr => arr.map(x=>({ symbol:x.symbol, lastClose:x.lastClose, rsi:x.rsi, signal:x.signal }));

  const searchRows = symbolList.slice(0,10).map(s=>({
    symbol:s.symbol, lastClose:favorites[s.symbol]?.price||null, rsi:"-", signal:"-"
  }));

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <b className="text-emerald-400 text-[20px]">🌍 Visionary Stock Screener</b>
          <button onClick={loadAll} className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 font-semibold">{loading?"Loading...":"🔁 Refresh"}</button>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Search Symbol (เช่น NVDA, IREN, BTDR…)"
          className="w-full sm:w-1/2 px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 outline-none text-center"
        />
      </div>

      {/* ข่าวต้นน้ำบนสุด */}
      <Section title="🧠 Early News Signals — ข่าวเพิ่งออก (ฟรี)">
        <div className="divide-y divide-white/5">
          {newsTop.map(n=>(
            <a key={n.link} href={n.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
              <span className="px-2 py-0.5 rounded text-xs bg-white/10">{n.symbol}</span>
              <span className="flex-1 text-sm">{n.title}</span>
              <span className={`text-xs ${n.sentiment>0?"text-green-400":n.sentiment<0?"text-red-400":"text-yellow-400"}`}>
                {n.sentiment>0?"Bullish":n.sentiment<0?"Bearish":"Neutral"}
              </span>
              <span className="text-xs text-gray-400 w-20 text-right">{Math.round(n.freshnessMin)}m</span>
            </a>
          ))}
          {!newsTop.length && <div className="px-4 py-4 text-sm text-gray-400">ยังไม่มีข่าวใหม่</div>}
        </div>
      </Section>

      {/* ผลค้นหาไว้บนสุด */}
      {search.trim() && searchRows.length>0 && (
        <Section title="🔎 Results">
          <Table rows={searchRows} />
        </Section>
      )}

      {/* 5 หมวดหลัก */}
      <Section title="⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด"><Table rows={mapSymbols(dataShort)} /></Section>
      <Section title="🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่"><Table rows={mapSymbols(dataMedium)} /></Section>
      <Section title="🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต"><Table rows={mapSymbols(dataLong)} /></Section>
      <Section title="💎 Hidden Gems — ต้นน้ำที่ตลาดยังไม่เห็น"><Table rows={mapSymbols(hidden)} /></Section>
      <Section title="🧪 AI Picks — สัญญาณรวมจาก Ensemble + ข่าว"><Table rows={mapSymbols(aiPicks)} /></Section>

      {/* Favorites */}
      {favorites.length>0 && (
        <Section title="⭐ My Favorites — หุ้นที่คุณติดดาวไว้">
          <Table rows={favorites.map(s=>({symbol:s, lastClose:favoritePrices[s]?.price||null, rsi:"-", signal:"-" }))} />
        </Section>
      )}

      {error && <div className="max-w-6xl mx-auto px-4 pb-6 text-red-400">{error}</div>}
    </main>
  );
    }
