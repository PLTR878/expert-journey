import { useEffect, useState } from "react";

export default function Home() {
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [newsFeed, setNewsFeed] = useState([]); // ✅ ข่าวใหม่
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("favorites");

  // ✅ โหลดรายการโปรด
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ โหลดข้อมูลทุกหมวด
  async function loadAll() {
    setLoading(true);
    try {
      const fetcher = async (url, body) =>
        fetch(url, {
          method: body ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        })
          .then((r) => r.json())
          .then((j) => j.results || []);
      const [short, medium, long, hiddenData, ai] = await Promise.all([
        fetcher("/api/screener", { horizon: "short" }),
        fetcher("/api/screener", { horizon: "medium" }),
        fetcher("/api/screener", { horizon: "long" }),
        fetcher("/api/hidden-gems"),
        fetcher("/api/ai-picks"),
      ]);
      setDataShort(short);
      setDataMedium(medium);
      setDataLong(long);
      setHidden(hiddenData);
      setAiPicks(ai);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ✅ ดึงราคา RSI AI Signal
  async function fetchYahooPrice(symbol) {
    try {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      if (!r.ok) return;
      const j = await r.json();
      setFavoritePrices((p) => ({
        ...p,
        [symbol]: {
          price: Number(j.price) || 0,
          rsi: j.rsi ?? "-",
          signal: j.signal ?? "-",
        },
      }));
    } catch {}
  }

  useEffect(() => {
    favorites.forEach(fetchYahooPrice);
  }, [favorites]);

  // ✅ ล้างรายการโปรด
  const clearFavorites = () => {
    if (confirm("Clear all favorites?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoritePrices({});
    }
  };

  // ✅ toggle Favorite
  const toggleFavorite = (sym) => {
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // ✅ ตารางหุ้น
  const Table = ({ rows, compact }) => (
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
          {rows.map((r) => {
            const isFav = favorites.includes(r.symbol);
            const f = favoritePrices[r.symbol];
            const priceText = f?.price
              ? `$${f.price.toFixed(2)}`
              : r.lastClose
              ? `$${r.lastClose.toFixed(2)}`
              : "-";
            const rsi = f?.rsi ?? r.rsi ?? "-";
            const sig = f?.signal ?? r.signal ?? "-";
            const sigColor =
              sig === "Buy"
                ? "text-green-400"
                : sig === "Sell"
                ? "text-red-400"
                : "text-yellow-400";
            return (
              <tr
                key={r.symbol}
                className={`border-b border-white/5 hover:bg-white/5 transition ${
                  compact ? "text-[13px]" : ""
                }`}
              >
                <td
                  onClick={() => toggleFavorite(r.symbol)}
                  className="cursor-pointer text-yellow-400 pl-4"
                >
                  {isFav ? "★" : "☆"}
                </td>
                <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                  <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                </td>
                <td className="p-2 font-mono">{priceText}</td>
                <td className="p-2 text-gray-300">{rsi}</td>
                <td className={`p-2 font-semibold ${sigColor}`}>{sig}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const favoriteData = favorites.map((s) => ({
    symbol: s,
    ...favoritePrices[s],
  }));

  // ✅ โหลดข่าวจาก API
  async function loadNews() {
    try {
      const res = await fetch("/api/news");
      const j = await res.json();
      setNewsFeed(j.articles || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (activeTab === "news") loadNews();
  }, [activeTab]);

  // ✅ UI
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <b className="text-emerald-400 text-lg sm:text-xl">
            🌍 Visionary Stock Screener
          </b>
          <button
            onClick={loadAll}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 text-sm font-semibold"
          >
            {loading ? "Loading..." : "🔁 Refresh"}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* ⭐ Favorites */}
        {activeTab === "favorites" && (
          <>
            {favoriteData.length > 0 ? (
              <div className="bg-[#101827]/70 rounded-2xl shadow-md p-4 mb-6">
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
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                ⭐ No favorites yet — tap “☆” to add your stocks.
              </div>
            )}
          </>
        )}

        {/* 🌐 Market */}
        {activeTab === "market" && (
          <div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-green-400 text-lg font-semibold mb-2">
                ⚡ Fast Movers
              </h2>
              <Table rows={dataShort.slice(0, 6)} compact />
            </div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-yellow-400 text-lg font-semibold mb-2">
                🌱 Emerging Trends
              </h2>
              <Table rows={dataMedium.slice(0, 6)} compact />
            </div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-sky-400 text-lg font-semibold mb-2">
                🚀 Future Leaders
              </h2>
              <Table rows={dataLong.slice(0, 6)} compact />
            </div>
            <div className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-cyan-300 text-lg font-semibold mb-2">
                💎 Hidden Gems
              </h2>
              <Table rows={hidden.slice(0, 6)} compact />
            </div>
          </div>
        )}

        {/* 🧠 News */}
        {activeTab === "news" && (
          <div className="px-3 py-5">
            <h2 className="text-purple-400 text-xl font-bold mb-4 text-center">
              🧠 AI Market News — Early Signals
            </h2>

            {newsFeed.length === 0 ? (
              <div className="text-center text-gray-400 py-4">Loading news...</div>
            ) : (
              <div className="grid gap-4">
                {newsFeed.map((n, i) => (
                  <a
                    key={i}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[#141b2d]/70 border border-white/10 rounded-2xl p-4 hover:bg-[#1d2941]/80 transition"
                  >
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-sky-400 font-semibold">{n.symbol}</span>
                      <span className="text-gray-400 text-xs">{n.time}</span>
                    </div>
                    <h2 className="text-emerald-300 font-semibold text-base mb-1">
                      {n.title}
                    </h2>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{n.publisher}</span>
                      <span
                        className={`font-bold ${
                          n.sentiment === "Positive"
                            ? "text-green-400"
                            : n.sentiment === "Negative"
                            ? "text-red-400"
                            : "text-yellow-300"
                        }`}
                      >
                        {n.sentiment}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ☰ Menu */}
        {activeTab === "menu" && (
          <div className="text-center text-gray-400 py-10">
            ⚙️ Settings / About / Version 1.0.0
          </div>
        )}
      </div>

      {/* ✅ Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "favorites" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">💙</span>
          Favorites
        </button>

        <button
          onClick={() => setActiveTab("market")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "market" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">🌐</span>
          Market
        </button>

        <button
          onClick={() => setActiveTab("news")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "news" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">🧠</span>
          News
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "menu" ? "text-blue-400" : "hover:text-blue-300"
          }`}
        >
          <span className="text-[18px]">☰</span>
          Menu
        </button>
      </nav>
    </main>
  );
                }
