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

  const toggleFavorite = (sym) =>
    setFavorites((p) =>
      p.includes(sym) ? p.filter((x) => x !== sym) : [...p, sym]
    );

  // ✅ ดึงราคาหุ้นรายตัวจาก API ใหม่
  async function fetchPrice(sym) {
    try {
      addLog(`🔍 Checking ${sym}...`);
      const r = await fetch(`/api/visionary-eternal?type=price&symbol=${sym}`);
      const j = await r.json();
      setFavoritePrices((p) => ({
        ...p,
        [sym]: {
          symbol: sym,
          price: j.price || 0,
          currency: j.currency || "USD",
          signal: j.signal || "Hold",
        },
      }));
      addLog(`✅ ${sym} → $${j.price?.toFixed(2) || "-"} (${j.currency})`);
    } catch (err) {
      addLog(`⚠️ Price error: ${err.message}`);
    }
  }

  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ===== MARKET AI (ใช้ type=market จาก API V∞.4)
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
      setFast(j.groups?.fast || []);
      setEmerging(j.groups?.emerging || []);
      setFuture(j.groups?.future || []);
      setHidden(j.groups?.hidden || []);
      addLog(`✅ Market groups loaded (${[
        j.groups?.fast?.length || 0,
        j.groups?.emerging?.length || 0,
        j.groups?.future?.length || 0,
        j.groups?.hidden?.length || 0,
      ].reduce((a, b) => a + b, 0)} symbols)`);
    } catch (err) {
      addLog(`❌ Market load failed: ${err.message}`);
    }
  }

  useEffect(() => {
    loadMarketData();
  }, []);

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
            <h2 className="text-emerald-400 text-lg mb-2">
              💙 My Favorite Stocks
            </h2>
            <Favorites
              data={favorites.map((f) => favoritePrices[f] || { symbol: f })}
            />
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

        {/* 🧠 Logs */}
        <section className="bg-black/30 mt-6 rounded-lg p-3 text-xs text-gray-400 max-h-48 overflow-auto border border-white/10">
          <b className="text-emerald-400">🧠 System Logs</b>
          <ul className="mt-2 space-y-1">
            {logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
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
