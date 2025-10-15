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

  // โหลด favorites
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  async function loadAll() {
    setLoading(true);
    setProgress(0);
    setEta(0);
    const start = Date.now();

    const fetcher = async (url, body) => {
      try {
        const r = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        const j = await r.json().catch(() => ({}));
        return j?.results || [];
      } catch {
        return [];
      }
    };

    try {
      const [short, medium, long, hiddenData] = await Promise.all([
        fetcher("/api/screener", { horizon: "short" }),
        fetcher("/api/screener", { horizon: "medium" }),
        fetcher("/api/screener", { horizon: "long" }),
        fetcher("/api/hidden-gems"),
      ]);

      // โหลดข่าวแบบปลอดภัย
      let newsData = [];
      try {
        const r = await fetch("/api/news");
        if (r.ok) {
          const j = await r.json().catch(() => []);
          if (Array.isArray(j.results)) newsData = j.results;
          else if (Array.isArray(j)) newsData = j;
        }
      } catch {}

      // โหลด AI picks ปลอดภัย
      let ai = [];
      try {
        const res = await fetch("/api/ai-picks?limit=200");
        const j = await res.json().catch(() => ({}));
        ai = Array.isArray(j.results) ? j.results : [];
      } catch {}

      // เติมราคาจริงให้หน้าแรก
      await Promise.all(
        ai.slice(0, 40).map(async (row) => {
          try {
            const r = await fetch(`/api/price?symbol=${row.symbol}`);
            const j = await r.json().catch(() => ({}));
            row.price = j.price ?? row.last ?? 0;
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
      setNewsFeed(newsData);
    } catch (err) {
      console.error(err);
      setError("Load failed");
    } finally {
      setLoading(false);
      setProgress(0);
      setEta(0);
    }
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchYahooPrice(symbol) {
    try {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      const j = await r.json().catch(() => ({}));
      setFavoritePrices((p) => ({
        ...p,
        [symbol]: { price: j.price ?? 0, rsi: j.rsi ?? "-", signal: j.signal ?? "-" },
      }));
    } catch {}
  }

  useEffect(() => {
    favorites.forEach(fetchYahooPrice);
  }, [favorites]);

  const toggleFavorite = (sym) =>
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );

  const clearFavorites = () => {
    if (confirm("Clear all favorites?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoritePrices({});
    }
  };

  const Table = ({ rows = [] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse text-center">
        <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
          <tr>
            <th className="p-2 text-left pl-4">⭐</th>
            <th className="p-2">Symbol</th>
            <th className="p-2">Price</th>
            <th className="p-2">RSI</th>
            <th className="p-2">AI</th>
          </tr>
        </thead>
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
              const price = r.price ?? "-";
              const rsi = r.rsi ?? "-";
              const sig = r.signal ?? "-";
              const color =
                sig === "Buy"
                  ? "text-green-400"
                  : sig === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400";
              const fav = favorites.includes(sym);
              return (
                <tr
                  key={sym + i}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td
                    onClick={() => toggleFavorite(sym)}
                    className="cursor-pointer text-yellow-400 pl-4"
                  >
                    {fav ? "★" : "☆"}
                  </td>
                  <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                    <a href={`/analyze/${sym}`}>{sym}</a>
                  </td>
                  <td className="p-2 font-mono">
                    {price !== "-" ? `$${Number(price).toFixed(2)}` : "-"}
                  </td>
                  <td className="p-2">{rsi}</td>
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
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <b className="text-emerald-400 text-lg">🌍 Visionary Stock Screener</b>
          <button
            onClick={loadAll}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 text-sm font-semibold"
          >
            {loading ? "Loading..." : "🔁 Refresh"}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {activeTab === "market" && (
          <>
            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-emerald-400/30">
              <h2 className="text-emerald-400 mb-2 font-semibold text-lg">
                🤖 AI Picks — Smart Buy Signals
              </h2>
              <Table rows={aiPicks.slice(0, 20)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-green-400 mb-2 font-semibold text-lg">
                ⚡ Fast Movers
              </h2>
              <Table rows={dataShort.slice(0, 6)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-yellow-400 mb-2 font-semibold text-lg">
                🌱 Emerging Trends
              </h2>
              <Table rows={dataMedium.slice(0, 6)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-sky-400 mb-2 font-semibold text-lg">
                🚀 Future Leaders
              </h2>
              <Table rows={dataLong.slice(0, 6)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-cyan-400/30">
              <h2 className="text-cyan-300 mb-2 font-semibold text-lg">
                💎 Hidden Gems
              </h2>
              <Table rows={hidden.slice(0, 6)} />
            </section>
          </>
        )}

        {activeTab === "favorites" && (
          <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-yellow-300 text-lg font-semibold">
                ⭐ My Favorites
              </h2>
              <button
                onClick={clearFavorites}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Clear All
              </button>
            </div>
            <Table rows={favoriteData} />
          </section>
        )}

        {activeTab === "news" && (
          <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-purple-400/30">
            <h2 className="text-purple-400 text-xl font-semibold mb-4">
              🧠 AI Market News — Early Signals
            </h2>
            {newsFeed.length === 0 ? (
              <div className="text-center text-gray-400">No news data available.</div>
            ) : (
              newsFeed.slice(0, 10).map((n, i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-[#0e1628]/80 rounded-xl p-4 mb-3"
                >
                  <div className="flex justify-between text-[12px] text-gray-400 mb-1">
                    <span className="text-sky-400 font-semibold">{n.symbol}</span>
                    <span>{n.time || n.date}</span>
                  </div>
                  <div className="text-[15px] font-medium text-emerald-300 mb-1">
                    {n.title}
                  </div>
                  <div className="text-[13px] text-gray-400 mb-2">{n.source}</div>
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
              ))
            )}
          </section>
        )}

        {activeTab === "menu" && (
          <section className="text-center text-gray-400 py-10">
            <h2 className="text-emerald-400 text-xl mb-3 font-semibold">
              ⚙️ Settings & Info
            </h2>
            <p>🌍 Visionary Stock Screener — AI-powered insights.</p>
            <p>📡 Auto refresh every 10 minutes.</p>
            <div className="text-xs text-gray-500 mt-3">
              Version 1.0.5 • {new Date().getFullYear()}
            </div>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "favorites" ? "text-blue-400" : ""
          }`}
        >
          <span className="text-[18px]">💙</span>Favorites
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "market" ? "text-blue-400" : ""
          }`}
        >
          <span className="text-[18px]">🌐</span>Market
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "news" ? "text-purple-400" : ""
          }`}
        >
          <span className="text-[18px]">🧠</span>News
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "menu" ? "text-blue-400" : ""
          }`}
        >
          <span className="text-[18px]">☰</span>Menu
        </button>
      </nav>
    </main>
  );
                }
