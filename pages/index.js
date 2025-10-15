import { useEffect, useState } from "react";

export default function Home() {
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [newsFeed, setNewsFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("market");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(0);

  // โหลด favorites จาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // โหลดข้อมูลทั้งหมด
  async function loadAll() {
    setLoading(true);
    setProgress(0);
    setEta(0);
    const start = Date.now();

    try {
      const fetcher = async (url, body) =>
        fetch(url, {
          method: body ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        })
          .then((r) => r.json())
          .then((j) => j.results || []);

      const [short, medium, long, hiddenData, newsData] = await Promise.all([
        fetcher("/api/screener", { horizon: "short" }),
        fetcher("/api/screener", { horizon: "medium" }),
        fetcher("/api/screener", { horizon: "long" }),
        fetcher("/api/hidden-gems"),
        fetch("/api/news").then((r) => r.json()).catch(() => []),
      ]);

      async function loadAIPicksAll() {
        const pageSize = 100;
        const maxPages = 30;
        let off = 0;
        let acc = [];
        for (let i = 0; i < maxPages; i++) {
          const res = await fetch(`/api/ai-picks?limit=${pageSize}&offset=${off}&nocache=1`);
          const j = await res.json();
          const chunk = j?.results || [];
          acc = acc.concat(chunk);
          const pct = ((i + 1) / maxPages) * 100;
          setProgress(pct);
          const elapsed = (Date.now() - start) / 1000;
          const est = (elapsed / (i + 1)) * maxPages;
          setEta(Math.max(est - elapsed, 0));
          if (chunk.length < pageSize) break;
          off += pageSize;
          await new Promise((r) => setTimeout(r, 120));
        }
        setProgress(100);
        setEta(0);
        return acc;
      }

      const ai = await loadAIPicksAll();

      await Promise.all(
        ai.slice(0, 40).map(async (row) => {
          try {
            const r = await fetch(`/api/price?symbol=${row.symbol}`);
            const j = await r.json();
            row.price = j.price ?? row.last;
            row.rsi = j.rsi ?? "-";
            row.signal = j.signal ?? "-";
          } catch {}
        })
      );

      setDataShort(short);
      setDataMedium(medium);
      setDataLong(long);
      setHidden(hiddenData);
      setAiPicks(ai);
      setNewsFeed(newsData?.results || newsData || []);
    } catch (err) {
      console.error(err);
      setError("Load data failed");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // โหลดราคาของ favorites
  async function fetchYahooPrice(symbol) {
    try {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      const j = await r.json();
      setFavoritePrices((p) => ({
        ...p,
        [symbol]: { price: j.price ?? 0, rsi: j.rsi ?? "-", signal: j.signal ?? "-" },
      }));
    } catch {}
  }

  useEffect(() => {
    favorites.forEach(fetchYahooPrice);
  }, [favorites]);

  const clearFavorites = () => {
    if (confirm("Clear all favorites?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoritePrices({});
    }
  };

  const toggleFavorite = (sym) =>
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );

  // ตารางหุ้น
  const Table = ({ rows = [], compact }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse text-center">
        {!compact && (
          <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
            <tr>
              <th className="p-2 text-left pl-4">⭐</th>
              <th className="p-2">Symbol</th>
              <th className="p-2">Price</th>
              <th className="p-2">RSI</th>
              <th className="p-2">AI</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-3 text-gray-500">
                No data available.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const sym = r.symbol || r.ticker || "";
              const isFav = favorites.includes(sym);
              const price = r.price ?? r.lastClose ?? "-";
              const rsi = r.rsi ?? "-";
              const sig = r.signal ?? "-";
              const color =
                sig === "Buy"
                  ? "text-green-400"
                  : sig === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400";
              return (
                <tr
                  key={sym + i}
                  className={`border-b border-white/5 hover:bg-white/5 transition ${
                    compact ? "text-[13px]" : ""
                  }`}
                >
                  <td
                    onClick={() => toggleFavorite(sym)}
                    className="cursor-pointer text-yellow-400 pl-4 select-none"
                  >
                    {isFav ? "★" : "☆"}
                  </td>
                  <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                    <a href={`/analyze/${sym}`}>{sym}</a>
                  </td>
                  <td className="p-2 font-mono">
                    {price !== "-" ? `$${Number(price).toFixed(2)}` : "-"}
                  </td>
                  <td className="p-2 text-gray-300">{rsi}</td>
                  <td className={`p-2 font-semibold ${color}`}>{sig}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const favoriteData = favorites.map((s) => ({ symbol: s, ...favoritePrices[s] }));

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <b className="text-emerald-400 text-lg sm:text-xl">
              🌍 Visionary Stock Screener
            </b>
            <button
              onClick={loadAll}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 text-sm font-semibold sm:ml-4"
            >
              {loading ? "Loading..." : "🔁 Refresh"}
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="🔍 Search symbol (e.g. NVDA, TSLA)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchSymbol.trim()) {
                  const sym = searchSymbol.trim().toUpperCase();
                  if (!favorites.includes(sym)) {
                    setFavorites((prev) => [...prev, sym]);
                    fetchYahooPrice(sym);
                  }
                  setSearchSymbol("");
                }
              }}
              className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-400 placeholder-gray-500"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Favorites */}
        {activeTab === "favorites" && (
          <div className="bg-[#101827]/70 rounded-2xl shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-yellow-300 text-lg font-semibold">⭐ My Favorites</h2>
              <button
                onClick={clearFavorites}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Clear All
              </button>
            </div>
            {favoriteData.length > 0 ? (
              <Table rows={favoriteData} />
            ) : (
              <div className="text-center text-gray-400 py-6">
                ⭐ No favorites yet — tap “☆” or search a symbol.
              </div>
            )}
          </div>
        )}

        {/* Market */}
        {activeTab === "market" && (
          <>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-emerald-400/30">
              <h2 className="text-emerald-400 text-lg font-semibold mb-2">
                🤖 AI Picks — Smart Buy Signals
              </h2>
              <Table rows={aiPicks.slice(0, 20)} compact />
            </div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-green-400 text-lg font-semibold mb-2">⚡ Fast Movers</h2>
              <Table rows={dataShort.slice(0, 6)} compact />
            </div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-yellow-400 text-lg font-semibold mb-2">
                🌱 Emerging Trends
              </h2>
              <Table rows={dataMedium.slice(0, 6)} compact />
            </div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-sky-400 text-lg font-semibold mb-2">🚀 Future Leaders</h2>
              <Table rows={dataLong.slice(0, 6)} compact />
            </div>
            {/* Hidden Gems */}
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-cyan-400/30">
              <h2 className="text-cyan-300 text-lg font-semibold mb-2">
                💎 Hidden Gems
              </h2>
              <Table rows={hidden.slice(0, 6)} compact />
            </div>
          </>
        )}

        {/* News */}
        {activeTab === "news" && (
          <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-purple-400/30">
            <h2 className="text-purple-400 text-xl font-semibold mb-4">
              🧠 AI Market News — Early Signals
            </h2>
            {newsFeed.length === 0 ? (
              <div className="text-gray-400 text-center py-6">No news data available.</div>
            ) : (
              newsFeed.slice(0, 20).map((n, i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-[#0e1628]/80 rounded-xl p-4 mb-4 shadow-sm"
                >
                  <div className="flex justify-between text-[12px] text-gray-400 mb-1">
                    <span className="text-sky-400 font-semibold">{n.symbol}</span>
                    <span>{n.time || n.date}</span>
                  </div>
                  <div className="text-[15px] font-medium text-emerald-300 mb-1">
                    {n.title}
                  </div>
                  <div className="text-[13px] text-gray-400 mb-2">{n.source}</div>
                  <div className="flex justify-between items-center">
                    <button className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs px-3 py-1 rounded-lg">
                      📄 Summary
                    </button>
                    <span
                      className={`text-xs font-semibold ${
                        n.sentiment === "Positive"
                          ? "text-green-400"
                          : n.sentiment === "Negative"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {n.sentiment || "Neutral"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Menu */}
        {activeTab === "menu" && (
          <div className="max-w-6xl mx-auto px-6 py-10 text-center text-gray-300">
            <h2 className="text-emerald-400 text-2xl font-bold mb-4">⚙️ Settings & Info</h2>
            <p className="mb-2">🌍 Visionary Stock Screener — AI-driven insights.</p>
            <p className="mb-4">📡 Auto-refresh every 10 minutes.</p>
            <button
              onClick={loadAll}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-5 py-2 rounded-lg text-emerald-300 text-sm font-semibold mb-5"
            >
              🔄 Reload Data
            </button>
            <div className="text-xs text-gray-500">
              Version 1.0.3 • Built by AI Engine • {new Date().getFullYear()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "favorites" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">💙</span>
          <span>Favorites</span>
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "market" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">🌐</span>
          <span>Market</span>
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "news" ? "text-purple-400" : "hover:text-purple-300"
          }`}
        >
          <span className="text-[18px]">🧠</span>
          <span>News</span>
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "menu" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">☰</span>
          <span>Menu</span>
        </button>
      </nav>
    </main>
  );
                }
