// ✅ Visionary Stock Screener — V∞.4 Universe Edition (Eternal API Connected)
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-30), `${new Date().toLocaleTimeString()} ${msg}`]);

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
    // ✅ เมื่อกดดาวให้โหลดราคาทันที
    await fetchPrice(sym);
  };

  // ✅ ดึงราคาหุ้นรายตัวจาก Eternal API
  async function fetchPrice(sym) {
    try {
      const r = await fetch(`/api/visionary-eternal?type=daily&symbol=${sym}`);
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

  // ✅ โหลดข้อมูล Market
  const [fast, setFast] = useState([]);
  const [emerging, setEmerging] = useState([]);
  const [future, setFuture] = useState([]);
  const [hidden, setHidden] = useState([]);

  async function loadMarketData() {
    try {
      addLog("📡 Loading AI Market Universe...");
      const res = await fetch(`/api/visionary-eternal?type=market`, {
        cache: "no-store",
      });
      const j = await res.json();

      // ✅ เพิ่มจำนวนหุ้นแต่ละหมวดเป็น 8 ตัว
      setFast((j.groups?.fast || []).slice(0, 8));
      setEmerging((j.groups?.emerging || []).slice(0, 8));
      setFuture((j.groups?.future || []).slice(0, 8));
      setHidden((j.groups?.hidden || []).slice(0, 8));

      addLog(`✅ Market groups loaded`);

      // ✅ โหลดราคาทุกหุ้นใน market โดยอัตโนมัติ
      const allSymbols = [
        ...j.groups.fast.map((x) => x.symbol),
        ...j.groups.emerging.map((x) => x.symbol),
        ...j.groups.future.map((x) => x.symbol),
        ...j.groups.hidden.map((x) => x.symbol),
      ];
      for (const s of allSymbols) await fetchPrice(s);
    } catch (err) {
      addLog(`❌ Market load failed: ${err.message}`);
    }
  }

  useEffect(() => {
    loadMarketData();
  }, []);

  // ✅ โหลดราคาสำหรับ favorites เมื่อมีการเพิ่ม/ลบ
  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ✅ Auto Refresh ทุก 1 นาที (ทั้ง market + favorites)
  useEffect(() => {
    const refreshData = async () => {
      addLog("🔁 Auto refreshing prices...");
      const allSymbols = [
        ...fast.map((x) => x.symbol),
        ...emerging.map((x) => x.symbol),
        ...future.map((x) => x.symbol),
        ...hidden.map((x) => x.symbol),
        ...favorites,
      ];
      for (const s of allSymbols) await fetchPrice(s);
    };
    const interval = setInterval(refreshData, 60 * 1000); // ทุก 1 นาที
    return () => clearInterval(interval);
  }, [fast, emerging, future, hidden, favorites]);

  // ===== UI =====
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <b className="text-emerald-400 text-lg sm:text-xl">
            🌍 Visionary Stock Screener — V∞.4 Universe
          </b>
          <input
            type="text"
            placeholder="🔍 Search (e.g. NVDA, TSLA)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                const s = search.trim().toUpperCase();
                if (!favorites.includes(s)) setFavorites([...favorites, s]);
                fetchPrice(s);
                setSearch("");
              }
            }}
            className="bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 w-full sm:w-64"
          />
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* FAVORITES */}
        {active === "favorites" && (
          <section>
            <h2 className="text-emerald-400 text-lg mb-2">💙 My Favorite Stocks</h2>
            <Favorites data={favorites.map((f) => favoritePrices[f] || { symbol: f })} />
          </section>
        )}

        {/* MARKET */}
        {active === "market" && (
          <>
            <MarketSection
              title="⚡ Fast Movers"
              rows={fast}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              favoritePrices={favoritePrices}
            />
            <MarketSection
              title="🌱 Emerging Trends"
              rows={emerging}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              favoritePrices={favoritePrices}
            />
            <MarketSection
              title="🚀 Future Leaders"
              rows={future}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              favoritePrices={favoritePrices}
            />
            <MarketSection
              title="💎 Hidden Gems"
              rows={hidden}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              favoritePrices={favoritePrices}
            />
          </>
        )}

        {/* 🧠 Logs Toggle */}
        <section className="mt-6">
          <button
            onClick={() => setShowLogs((p) => !p)}
            className="flex items-center gap-2 bg-[#141b2d] border border-white/10 px-3 py-2 rounded-xl text-xs text-emerald-400 hover:bg-emerald-500/10 transition-all"
          >
            <span className="text-[14px]">🧠</span>
            <span>{showLogs ? "Hide Logs" : "Show System Logs"}</span>
          </button>

          {showLogs && (
            <div className="mt-2 bg-black/40 rounded-xl border border-white/10 p-3 text-xs text-gray-400 max-h-48 overflow-auto shadow-inner animate-fadeIn">
              <ul className="space-y-1">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "Market", icon: "🌐" },
          { id: "scan", label: "Scanner", icon: "📡" },
          { id: "trade", label: "AI Trade", icon: "🤖" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`py-2 flex flex-col items-center ${
              active === t.id ? "text-emerald-400" : ""
            }`}
          >
            <span className="text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
              }
