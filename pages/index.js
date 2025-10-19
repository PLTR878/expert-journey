// ✅ Visionary Stock Screener — V∞.7 (Linked Edition)
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
const [active, setActive] = useState("favorites");
const [favorites, setFavorites] = useState([]);
const [favoritePrices, setFavoritePrices] = useState({});
const [logs, setLogs] = useState([]);
const [showLogs, setShowLogs] = useState(false);

const addLog = (msg) =>
setLogs((p) => [...p.slice(-30), ${new Date().toLocaleTimeString()} ${msg}]);

// ===== FAVORITES =====
useEffect(() => {
const s = localStorage.getItem("favorites");
if (s) setFavorites(JSON.parse(s));
}, []);

useEffect(() => {
localStorage.setItem("favorites", JSON.stringify(favorites));
}, [favorites]);

const toggleFavorite = async (sym) => {
setFavorites((p) =>
p.includes(sym) ? p.filter((x) => x !== sym) : [...p, sym]
);
await fetchPrice(sym);
};

// ✅ ดึงราคาหุ้นรายตัวจาก API
async function fetchPrice(sym) {
try {
const r = await fetch(/api/visionary-eternal?type=daily&symbol=${sym});
const j = await r.json();
setFavoritePrices((p) => ({
...p,
[sym]: {
symbol: sym,
price: j.lastClose || 0,
rsi: j.rsi || 0,
signal:
j.trend === "Uptrend"
? "Buy"
: j.trend === "Downtrend"
? "Sell"
: "Hold",
},
}));
} catch (err) {
console.error("Fetch error:", sym, err.message);
}
}

// ✅ โหลดข้อมูลตลาด
const [fast, setFast] = useState([]);
const [emerging, setEmerging] = useState([]);
const [future, setFuture] = useState([]);
const [hidden, setHidden] = useState([]);

async function loadMarketData() {
try {
addLog("📡 Loading AI Market...");
const res = await fetch(/api/visionary-eternal?type=market, {
cache: "no-store",
});
const j = await res.json();

setFast((j.groups?.fast || []).slice(0, 8));  
  setEmerging((j.groups?.emerging || []).slice(0, 8));  
  setFuture((j.groups?.future || []).slice(0, 8));  
  setHidden((j.groups?.hidden || []).slice(0, 8));  

  addLog(`✅ Market loaded`);  
  const all = [  
    ...j.groups.fast.map((x) => x.symbol),  
    ...j.groups.emerging.map((x) => x.symbol),  
    ...j.groups.future.map((x) => x.symbol),  
    ...j.groups.hidden.map((x) => x.symbol),  
  ];  
  for (const s of all) await fetchPrice(s);  
} catch (err) {  
  addLog(`❌ Load failed: ${err.message}`);  
}

}

useEffect(() => {
loadMarketData();
}, []);

useEffect(() => {
favorites.forEach(fetchPrice);
}, [favorites]);

// ✅ อัปเดตราคาอัตโนมัติทุก 1 นาที
useEffect(() => {
const refresh = async () => {
addLog("🔁 Refreshing prices...");
const all = [
...fast.map((x) => x.symbol),
...emerging.map((x) => x.symbol),
...future.map((x) => x.symbol),
...hidden.map((x) => x.symbol),
...favorites,
];
for (const s of all) await fetchPrice(s);
};
const interval = setInterval(refresh, 60 * 1000);
return () => clearInterval(interval);
}, [fast, emerging, future, hidden, favorites]);

// ===== UI =====
return (
<main className="min-h-screen bg-[#0b1220] text-white pb-16">
{/* ✅ ไม่มีกรอบบนสุด */}
<header className="px-3 py-0 h-[4px] bg-[#0b1220]" />

{/* Body */}  
  <div className="max-w-6xl mx-auto px-3 pt-2">  
    {/* FAVORITES */}  
    {active === "favorites" && (  
      <section className="mt-2">  
        <Favorites  
          data={favorites.map((f) => favoritePrices[f] || { symbol: f })}  
          favorites={favorites}  
          setFavorites={setFavorites}  
          fetchPrice={fetchPrice}  
        />  
      </section>  
    )}  
{active === "market" && (
  <>
    {/* ✅ ปุ่มแนวนอนด้านบน */}
    <div className="flex justify-between items-center gap-2 mb-4 overflow-x-auto scrollbar-hide px-1">
      {[
        { id: "fast", label: "⚡ Fast Movers" },
        { id: "future", label: "🚀 Future Leaders" },
        { id: "hidden", label: "💎 Hidden Gems" },
        { id: "emerging", label: "🌱 Emerging Trends" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all min-w-[90px]
            ${
              active === tab.id
                ? "bg-emerald-500/30 border border-emerald-400 text-emerald-300 shadow-md"
                : "bg-[#111827]/80 border border-gray-700 text-gray-400 hover:text-emerald-400 hover:border-emerald-400/50"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* ✅ แสดงเนื้อหาตามหมวดที่เลือก */}
    {active === "fast" && (
      <MarketSection
        title="⚡ Fast Movers"
        rows={fast}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        favoritePrices={favoritePrices}
      />
    )}

    {active === "emerging" && (
      <MarketSection
        title="🌱 Emerging Trends"
        rows={emerging}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        favoritePrices={favoritePrices}
      />
    )}

    {active === "future" && (
      <MarketSection
        title="🚀 Future Leaders"
        rows={future}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        favoritePrices={favoritePrices}
      />
    )}

    {active === "hidden" && (
      <MarketSection
        title="💎 Hidden Gems"
        rows={hidden}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        favoritePrices={favoritePrices}
      />
    )}
  </>
)}
    
    {/* 🧠 Logs */}  
    <section className="mt-5">  
      <button  
        onClick={() => setShowLogs((p) => !p)}  
        className="flex items-center gap-2 bg-[#141b2d] border border-white/10 px-2 py-1 rounded-md text-[11px] text-emerald-400 hover:bg-emerald-500/10 transition-all"  
      >  
        <span className="text-[12px]">🧠</span>  
        <span>{showLogs ? "Hide Logs" : "Show Logs"}</span>  
      </button>  

      {showLogs && (  
        <div className="mt-2 bg-black/30 rounded-md border border-white/10 p-2 text-[11px] text-gray-400 max-h-44 overflow-auto shadow-inner">  
          <ul className="space-y-0.5">  
            {logs.length ? (  
              logs.map((l, i) => <li key={i}>{l}</li>)  
            ) : (  
              <li className="text-gray-500">No logs yet.</li>  
            )}  
          </ul>  
        </div>  
      )}  
    </section>  
  </div>  

  {/* Bottom Navigation */}  
  <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px] z-50">  
    {[  
      { id: "favorites", label: "Favorites", icon: "💙" },  
      { id: "market", label: "Market", icon: "🌐" },  
      { id: "scan", label: "Scanner", icon: "📡" },  
      { id: "trade", label: "AI Trade", icon: "🤖" },  
    ].map((t) => (  
      <button  
        key={t.id}  
        onClick={() => setActive(t.id)}  
        className={`py-1 flex flex-col items-center ${  
          active === t.id ? "text-emerald-400" : ""  
        }`}  
      >  
        <span className="text-[16px]">{t.icon}</span>  
        {t.label}  
      </button>  
    ))}  
  </nav>  
</main>

);
}


  
