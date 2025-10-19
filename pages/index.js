// ✅ Visionary Stock Screener — V∞.10 (Future Discovery Market Edition)
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("favorites");
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [futureDiscovery, setFutureDiscovery] = useState([]);

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
    await fetchPrice(sym);
  };

  // ✅ ดึงราคาหุ้นรายตัวจาก API
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

  // ✅ โหลดข้อมูล “หุ้นต้นน้ำ อนาคตไกล”
  async function loadDiscovery() {
    try {
      addLog("🌋 Discovering future leaders...");
      const res = await fetch(`/api/visionary-eternal?type=ai-discovery`, {
        cache: "no-store",
      });
      const j = await res.json();
      setFutureDiscovery(j.discovered || []);
      addLog("✅ Future Discovery loaded");

      for (const s of j.discovered || []) await fetchPrice(s.symbol);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
    }
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ✅ รีเฟรชทุก 1 นาที
  useEffect(() => {
    const refresh = async () => {
      addLog("🔁 Refreshing prices...");
      for (const s of futureDiscovery.map((x) => x.symbol)) await fetchPrice(s);
      await loadDiscovery();
    };
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [futureDiscovery]);

  // ===== UI =====
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="px-3 py-0 h-[4px] bg-[#0b1220]" />

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

        {/* หุ้นต้นน้ำ อนาคตไกล */}
        {active === "market" && (
          <>
            <MarketSection
              title="🌋 หุ้นต้นน้ำ อนาคตไกล (Future Discovery)"
              rows={futureDiscovery}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              favoritePrices={favoritePrices}
            />
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

      {/* ✅ Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "หุ้นต้นน้ำ", icon: "🌋" },
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
