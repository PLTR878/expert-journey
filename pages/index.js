// ✅ Visionary Stock Screener V4.7 — Galaxy + Auto Trade + Dashboard + Real-Time Scan HUD
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  // ---------- STATES ----------
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [aiPicks, setAiPicks] = useState([]);
  const [fast, setFast] = useState([]);
  const [emerging, setEmerging] = useState([]);
  const [future, setFuture] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [active, setActive] = useState("market");
  const [search, setSearch] = useState("");

  // ---------- AUTO SCAN ----------
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState([]);
  const [batch, setBatch] = useState(1);
  const [scannedCount, setScannedCount] = useState(0);
  const [latestSymbol, setLatestSymbol] = useState("-");
  const totalSymbols = 7000;

  async function runAutoScan() {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setMatches([]);
    setBatch(1);
    setScannedCount(0);
    setLatestSymbol("-");

    for (let i = 0; i < totalSymbols; i += 200) {
      try {
        const res = await fetch(`/api/scan?offset=${i}&limit=200`);
        const data = await res.json();

        if (data.batch?.lastSymbol) setLatestSymbol(data.batch.lastSymbol);

        if (Array.isArray(data.results)) {
          const found = data.results.filter((x) => x.signal === "Buy");
          if (found.length > 0) new Audio("/ding.mp3").play();
          setMatches((p) => [...p, ...found]);
        }

        setScannedCount(i + (data.batch?.scanned || 0));
        setProgress(data.batch?.percent || ((i + 200) / totalSymbols) * 100);
        setBatch((b) => b + 1);
      } catch (e) {
        console.error(e);
      }
    }

    setRunning(false);
    setProgress(100);
    setLatestSymbol("✅ Done");
  }

  // ---------- AUTO TRADE ----------
  const [autoTrades, setAutoTrades] = useState([]);
  const [tradeRunning, setTradeRunning] = useState(false);

  async function runAutoTrade() {
    if (tradeRunning) return;
    setTradeRunning(true);
    try {
      const res = await fetch("/api/auto-trade");
      const data = await res.json();
      setAutoTrades(data.trades || []);
      if (data.trades?.length > 0) new Audio("/ding.mp3").play();
    } catch (e) {
      console.error(e);
    } finally {
      setTradeRunning(false);
    }
  }

  // ---------- FAVORITES ----------
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

  // ---------- MARKET DATA ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        const pick = await fetch(`/api/ai-picks?limit=150&offset=0`)
          .then((r) => r.json())
          .catch(() => ({ results: [] }));
        setAiPicks(pick.results || []);

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

        const hid = await fetch(`/api/screener-hybrid?mode=swing`)
          .then((r) => r.json())
          .catch(() => ({ results: [] }));
        setHidden(hid.results || []);
      } catch (e) {
        console.error("Load market error:", e);
      }
    };
    loadData();
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

  // ---------- UI ----------
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <b className="text-emerald-400 text-lg sm:text-xl">
            🌍 Visionary Stock Screener — Galaxy Universe
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

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* FAVORITES */}
        {active === "favorites" && <Favorites data={favData} />}

        {/* MARKET */}
        {active === "market" && (
          <>
            <MarketSection title="🤖 AI Picks" rows={aiPicks} favorites={favorites} favoritePrices={favoritePrices} toggleFavorite={toggleFavorite} />
            <MarketSection title="⚡ Fast Movers" rows={fast} favorites={favorites} favoritePrices={favoritePrices} toggleFavorite={toggleFavorite} />
            <MarketSection title="🌱 Emerging Trends" rows={emerging} favorites={favorites} favoritePrices={favoritePrices} toggleFavorite={toggleFavorite} />
            <MarketSection title="🚀 Future Leaders" rows={future} favorites={favorites} favoritePrices={favoritePrices} toggleFavorite={toggleFavorite} />
            <MarketSection title="💎 Hidden Gems" rows={hidden} favorites={favorites} favoritePrices={favoritePrices} toggleFavorite={toggleFavorite} />
          </>
        )}

        {/* AUTO SCAN */}
        {active === "scan" && (
          <section className="text-sm text-gray-200">
            <h2 className="text-emerald-400 text-lg mb-2">📡 Auto Scan — US Stocks</h2>
            <div className="bg-[#111a2c] p-4 rounded-lg border border-white/10">
              <button onClick={runAutoScan} disabled={running} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 mb-3 w-full">
                ▶ {running ? "Scanning..." : "Run Scan Now"}
              </button>
              <div className="text-xs text-gray-400 mb-1">
                🧩 Now Scanning: <b className="text-emerald-400">{latestSymbol}</b>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-3">
                <div className="h-2 bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Progress: {progress.toFixed(1)}% | Batch {batch} | Total {scannedCount} / {totalSymbols} | Buy Signals:{" "}
                <b className="text-green-400">{matches.length}</b>
              </div>
              <ul className="max-h-64 overflow-auto text-xs space-y-1 bg-black/30 rounded-lg p-2 font-mono">
                {matches.map((m, i) => (
                  <li key={i}>🟢 {m.symbol.padEnd(6)} — ${m.price.toFixed(2)} | RSI {Math.round(m.rsi)} | {m.signal}</li>
                ))}
              </ul>
              {running && <p className="text-[11px] text-gray-400 mt-1 animate-pulse">🔍 กำลังสแกนตลาดหุ้นอเมริกาแบบเรียลไทม์...</p>}
            </div>
          </section>
        )}

        
      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "Market", icon: "🌐" },
          { id: "scan", label: "Auto Scan", icon: "📡" },
          { id: "trade", label: "Auto Trade", icon: "🤖" },
          { id: "dashboard", label: "Dashboard", icon: "📊" },
          { id: "menu", label: "Menu", icon: "☰" },
        ].map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`py-2 flex flex-col items-center ${active === t.id ? "text-emerald-400" : ""}`}>
            <span className="text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
{/* AUTO TRADE */}
        {active === "trade" && (
          <section className="text-sm text-gray-200 mt-4">
            <h2 className="text-emerald-400 text-lg mb-2">🤖 Auto Trade — AI Contracts</h2>
            <div className="bg-[#111a2c] p-4 rounded-lg border border-white/10">
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
                      {t.action === "BUY" ? "🟢 BUY" : "🔴 SELL"} <b>{t.symbol}</b> — ${t.price} | RSI {t.rsi} | Δ {t.change}%
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        )}

        {/* DASHBOARD */}
        {active === "dashboard" && (
          <section className="text-sm text-gray-200">
            <h2 className="text-emerald-400 text-lg mb-3">📊 AI Dashboard — Real-Time Performance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#111a2c] p-3 rounded-lg border border-white/10 text-center">
                <p className="text-gray-400 text-xs">Scanned Stocks</p>
                <p className="text-emerald-400 text-lg font-bold">{scannedCount}</p>
              </div>
              <div className="bg-[#111a2c] p-3 rounded-lg border border-white/10 text-center">
                <p className="text-gray-400 text-xs">AI Buy Signals</p>
                <p className="text-green-400 text-lg font-bold">{matches.filter((m) => m.signal === "Buy").length}</p>
              </div>
              <div className="bg-[#111a2c] p-3 rounded-lg border border-white/10 text-center">
                <p className="text-gray-400 text-xs">Active Trades</p>
                <p className="text-yellow-400 text-lg font-bold">{autoTrades.length}</p>
              </div>
              <div className="bg-[#111a2c] p-3 rounded-lg border border-white/10 text-center">
                <p className="text-gray-400 text-xs">System</p>
                <p className={`${running || tradeRunning ? "text-emerald-400" : "text-gray-400"} text-lg font-bold`}>
                  {running || tradeRunning ? "RUNNING" : "IDLE"}
                </p>
              </div>
            </div>

            <div className="bg-[#111a2c] p-4 rounded-lg border border-white/10 mb-4">
              <h3 className="text-emerald-400 text-sm mb-2">🧠 Top AI Buy Signals</h3>
              {matches.length === 0 ? (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูลสแกน...</p>
              ) : (
                <ul className="text-xs space-y-1">
                  {matches
                    .filter((x) => x.signal === "Buy")
                    .slice(0, 10)
                    .map((m, i) => (
                      <li key={i}>
                        🟢 <b>{m.symbol}</b> — ${m.price.toFixed(2)} | RSI {m.rsi}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="bg-[#111a2c] p-4 rounded-lg border border-white/10">
              <h3 className="text-emerald-400 text-sm mb-2">🤖 Active AI Trades</h3>
              {autoTrades.length === 0 ? (
                <p className="text-gray-400 text-xs">ยังไม่มีสัญญาซื้อขาย...</p>
              ) : (
                <ul className="text-xs space-y-1">
                  {autoTrades.map((t, i) => (
                    <li key={i}>
                      {t.action === "BUY" ? "🟢 BUY" : "🔴 SELL"} <b>{t.symbol}</b> — ${t.price} | RSI {t.rsi} | Δ {t.change}%
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* MENU */}
        {active === "menu" && (
          <section className="text-center text-gray-400 py-10">
            <h2 className="text-emerald-400 text-xl mb-3 font-semibold">⚙️ Settings & Info</h2>
            <p>📡 Auto Scan + AI Trade + Dashboard</p>
            <p>💾 Favorites stored locally</p>
            <p>🔔 Alerts with Sound</p>
            <div className="text-xs text-gray-500 mt-3">
              Version 4.5 — Galaxy Universe
            </div>
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
            className={`py-2 flex flex-col items-center ${active === t.id ? "text-emerald-400" : ""}`}
          >
            <span className="text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
                  }
