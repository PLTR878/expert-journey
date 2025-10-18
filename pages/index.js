// ✅ Visionary Stock Screener V5.0 — Stable Build
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [search, setSearch] = useState("");

  // ====== AUTO SCAN ======
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [latestSymbol, setLatestSymbol] = useState("-");
  const totalSymbols = 7000;

  async function runAutoScan() {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setMatches([]);
    setScannedCount(0);
    setLatestSymbol("-");

    for (let i = 0; i < totalSymbols; i += 800) {
      try {
        const res = await fetch(`/api/scan?offset=${i}&limit=800`);
        const data = await res.json();
        if (Array.isArray(data.results)) {
          setMatches((prev) => [...prev, ...data.results]);
          setLatestSymbol(data.batch?.lastSymbol || "-");
        }
        setScannedCount(i + 800);
        setProgress(((i + 800) / totalSymbols) * 100);
      } catch (err) {
        console.error(err);
      }
    }
    setRunning(false);
  }

  // ====== AUTO TRADE ======
  const [autoTrades, setAutoTrades] = useState([]);
  const [tradeRunning, setTradeRunning] = useState(false);
  async function runAutoTrade() {
    if (tradeRunning) return;
    setTradeRunning(true);
    try {
      const res = await fetch("/api/auto-trade");
      const data = await res.json();
      setAutoTrades(data.trades || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTradeRunning(false);
    }
  }

  // ====== FAVORITES ======
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (sym) =>
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );

  async function fetchPrice(sym) {
    try {
      const r = await fetch(`/api/price?symbol=${sym}`);
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

  // ====== MARKET ======
  const [fast, setFast] = useState([]);
  const [emerging, setEmerging] = useState([]);
  const [future, setFuture] = useState([]);
  const [hidden, setHidden] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const s1 = await fetch(`/api/screener-hybrid?mode=short`)
          .then((r) => r.json())
          .catch(() => ({ results: [] }));
        setFast(s1.results || []);

        const s2 = await fetch(`/api/screener-hybrid?mode=swing`)
          .then((r) => r.json())
          .catch(() => ({ results: [] }));
        setEmerging(s2.results || []);

        const s3 = await fetch(`/api/screener-hybrid?mode=long`)
          .then((r) => r.json())
          .catch(() => ({ results: [] }));
        setFuture(s3.results || []);

        const s4 = await fetch(`/api/screener-hybrid?mode=hidden`)
          .then((r) => r.json())
          .catch(() => ({ results: [] }));
        setHidden(s4.results || []);
      } catch (e) {
        console.error("Market load error:", e);
      }
    }
    loadData();
  }, []);

  // ====== UI ======
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <b className="text-emerald-400 text-lg sm:text-xl">
            🌍 Visionary Stock Screener — Galaxy + Auto Trade
          </b>
          <input
            type="text"
            placeholder="🔍 Search symbol (e.g. NVDA, TSLA)"
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
        {/* Market */}
        {active === "market" && (
          <>
            <MarketSection title="⚡ Fast Movers" rows={fast} favorites={favorites} toggleFavorite={toggleFavorite} favoritePrices={favoritePrices} />
            <MarketSection title="🌱 Emerging Trends" rows={emerging} favorites={favorites} toggleFavorite={toggleFavorite} favoritePrices={favoritePrices} />
            <MarketSection title="🚀 Future Leaders" rows={future} favorites={favorites} toggleFavorite={toggleFavorite} favoritePrices={favoritePrices} />
            <MarketSection title="💎 Hidden Gems" rows={hidden} favorites={favorites} toggleFavorite={toggleFavorite} favoritePrices={favoritePrices} />
          </>
        )}

        {/* Favorites */}
        {active === "favorites" && <Favorites data={favorites.map((f) => favoritePrices[f] || { symbol: f })} />}

        {/* Auto Scan */}
        {active === "scan" && (
          <section className="bg-[#111a2c] p-4 rounded-lg border border-white/10">
            <h2 className="text-emerald-400 text-lg mb-2">📡 Auto Scan — Real-Time</h2>
            <button
              onClick={runAutoScan}
              disabled={running}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 mb-3 w-full"
            >
              {running ? "🔍 Scanning..." : "▶ Run Auto Scan"}
            </button>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-2">
              <div className="h-2 bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Progress: {progress.toFixed(1)}% | Scanned: {scannedCount}/{totalSymbols}
              <br />Now Scanning: <span className="text-emerald-400">{latestSymbol}</span>
            </p>
            <ul className="max-h-64 overflow-auto text-xs space-y-1 bg-black/30 rounded-lg p-2">
              {matches.map((m, i) => (
                <li key={i}>
                  ✅ {m.symbol} — ${m.price?.toFixed(2)} | RSI {m.rsi?.toFixed(1)} | {m.signal}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Auto Trade */}
        {active === "trade" && (
          <section className="bg-[#111a2c] p-4 rounded-lg border border-white/10 mt-4">
            <h2 className="text-emerald-400 text-lg mb-2">🤖 Auto Trade — AI Contracts</h2>
            <button
              onClick={runAutoTrade}
              disabled={tradeRunning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 mb-3 w-full"
            >
              ⚡ {tradeRunning ? "Processing..." : "Run Auto Trade"}
            </button>
            <ul className="max-h-64 overflow-auto text-xs space-y-1 bg-black/30 rounded-lg p-2">
              {autoTrades.length === 0 ? (
                <li className="text-gray-400">ยังไม่มีสัญญาซื้อขาย...</li>
              ) : (
                autoTrades.map((t, i) => (
                  <li key={i}>
                    {t.action === "BUY" ? "🟢 BUY" : "🔴 SELL"} {t.symbol} — ${t.price} | RSI {t.rsi} | Δ {t.change}%
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {/* Dashboard */}
        {active === "dashboard" && (
          <section className="bg-[#111a2c] p-4 rounded-lg border border-white/10">
            <h2 className="text-emerald-400 text-lg mb-2">📊 Dashboard Overview</h2>
            <p className="text-xs text-gray-400 mb-2">
              Total Scanned: {scannedCount} | Buy Signals: {matches.filter((m) => m.signal === "Buy").length}
            </p>
            <ul className="text-xs space-y-1 bg-black/30 rounded-lg p-2 max-h-64 overflow-auto">
              {matches
                .filter((m) => m.signal === "Buy")
                .slice(0, 10)
                .map((m, i) => (
                  <li key={i}>🟢 {m.symbol} — ${m.price?.toFixed(2)} | RSI {m.rsi?.toFixed(1)}</li>
                ))}
            </ul>
          </section>
        )}

        {/* Menu */}
        {active === "menu" && (
          <section className="text-center text-gray-400 py-10">
            <h2 className="text-emerald-400 text-xl mb-3 font-semibold">⚙️ Settings & Info</h2>
            <p>🌍 Visionary Stock Screener + Auto Trade</p>
            <p>💾 Local storage favorites</p>
            <p>🔔 Sound alerts active</p>
            <p className="text-xs text-gray-500 mt-3">Version 5.0 — Galaxy Universe</p>
          </section>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "Market", icon: "🌐" },
          { id: "scan", label: "Auto Scan", icon: "📡" },
          { id: "trade", label: "Auto Trade", icon: "🤖" },
          { id: "dashboard", label: "Dashboard", icon: "📊" },
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
