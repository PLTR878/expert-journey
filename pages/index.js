// ✅ pages/index.js — Visionary Stock Screener (Galaxy + Multi-Mode)
import { useEffect, useState } from "react";
import AutoMarketScan from "../components/AutoMarketScan";
import AlertSystem from "../components/AlertSystem";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import NewsFeedPro from "../components/NewsFeedPro";
import AutoScanPro from "../components/AutoScanPro"; // ✅ เพิ่มสแกน 3 โหมด

export default function Home() {
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [aiPicks, setAiPicks] = useState([]);
  const [fast, setFast] = useState([]);
  const [emerging, setEmerging] = useState([]);
  const [future, setFuture] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [active, setActive] = useState("market");
  const [search, setSearch] = useState("");

  // ----- Favorites -----
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

  async function fetchPrice(sym) {
    try {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(sym)}`);
      const j = await r.json();
      setFavoritePrices((p) => ({
        ...p,
        [sym]: { symbol: sym, price: j.price, rsi: j.rsi, signal: j.signal },
      }));
    } catch {}
  }
  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ----- Load lists -----
  useEffect(() => {
    const f = async () => {
      const pick = await fetch(`/api/ai-picks?limit=150&offset=0&nocache=1`)
        .then((r) => r.json())
        .catch(() => ({ results: [] }));
      setAiPicks(pick.results || []);

      const s1 = await fetch(`/api/screener?horizon=short`)
        .then((r) => r.json())
        .catch(() => ({ results: [] }));
      const s2 = await fetch(`/api/screener?horizon=medium`)
        .then((r) => r.json())
        .catch(() => ({ results: [] }));
      const s3 = await fetch(`/api/screener?horizon=long`)
        .then((r) => r.json())
        .catch(() => ({ results: [] }));

      setFast(s1.results || []);
      setEmerging(s2.results || []);
      setFuture(s3.results || []);

      const hid = await fetch(`/api/hidden-gems`)
        .then((r) => r.json())
        .catch(() => ({ results: [] }));
      setHidden(hid.results || []);
    };
    f();
  }, []);

  const addBySearch = (sym) => {
    if (!sym) return;
    const S = sym.toUpperCase();
    if (!favorites.includes(S)) setFavorites((p) => [...p, S]);
    fetchPrice(S);
  };

  const favData = favorites.map((s) => ({
    symbol: s,
    ...(favoritePrices[s] || {}),
  }));

  // ----- UI -----
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <b className="text-emerald-400 text-lg sm:text-xl">
            🌍 Visionary Stock Screener — Galaxy Edition
          </b>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="🔍 Search symbol (e.g. NVDA, TSLA)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addBySearch(search.trim());
                  setSearch("");
                }
              }}
              className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-400 placeholder-gray-500"
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {active === "market" && (
          <>
            <MarketSection
              title="🤖 AI Picks — Smart Buy Signals"
              rows={aiPicks}
              favorites={favorites}
              favoritePrices={favoritePrices}
              toggleFavorite={toggleFavorite}
            />
            <MarketSection
              title="⚡ Fast Movers"
              rows={fast}
              favorites={favorites}
              favoritePrices={favoritePrices}
              toggleFavorite={toggleFavorite}
            />
            <MarketSection
              title="🌱 Emerging Trends"
              rows={emerging}
              favorites={favorites}
              favoritePrices={favoritePrices}
              toggleFavorite={toggleFavorite}
            />
            <MarketSection
              title="🚀 Future Leaders"
              rows={future}
              favorites={favorites}
              favoritePrices={favoritePrices}
              toggleFavorite={toggleFavorite}
            />
            <MarketSection
              title="💎 Hidden Gems"
              rows={hidden}
              favorites={favorites}
              favoritePrices={favoritePrices}
              toggleFavorite={toggleFavorite}
            />
          </>
        )}

        {active === "favorites" && <Favorites data={favData} />}
        {active === "news" && <NewsFeedPro />} {/* ✅ AI ข่าว */}
        {active === "alerts" && (
          <>
            <AlertSystem />
            <div className="mt-4" />
            <AutoMarketScan />
            <AutoScanPro /> {/* ✅ เพิ่มสแกน 3 โหมด */}
          </>
        )}
        {active === "menu" && (
          <section className="text-center text-gray-400 py-10">
            <h2 className="text-emerald-400 text-xl mb-3 font-semibold">
              ⚙️ Settings & Info
            </h2>
            <p>📡 Auto refresh lists on load</p>
            <p>💾 Favorites stored locally</p>
            <p>🔔 Alerts check every 1 minute</p>
            <div className="text-xs text-gray-500 mt-3">
              Version 2.5 Galaxy Edition + AI Multi-Mode
            </div>
          </section>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "Market", icon: "🌐" },
          { id: "news", label: "News", icon: "🧠" },
          { id: "alerts", label: "Alerts", icon: "🔔" },
          { id: "menu", label: "Menu", icon: "☰" },
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
