import { useEffect, useState } from "react";
import AutoMarketScan from "../components/AutoMarketScan"; // ✅ เพิ่มการเชื่อมกับ component ใหม่

/* =========================================================
   🌍 Visionary Stock Screener — FULL SYSTEM
   - Tabs: Market, Favorites, News, Alerts, Menu
   - Auto Scan, Alerts, Progress, LocalStorage, Toast, Beep
========================================================= */

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

  // ---------- LocalStorage: favorites ----------
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ---------- Helper ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const normalizeNews = (raw) => {
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.articles)
      ? raw.articles
      : Array.isArray(raw?.results)
      ? raw.results
      : [];
    return arr.map((n) => ({
      symbol: n.symbol || n.ticker || n.Symbol || "-",
      title: n.title || n.headline || "(no title)",
      url: n.url || n.link || "#",
      publisher: n.publisher || n.source || "",
      time: n.time || n.date || "",
      sentiment:
        n.sentiment ||
        n.Sentiment ||
        (typeof n.score === "number"
          ? n.score > 0.25
            ? "Positive"
            : n.score < -0.25
            ? "Negative"
            : "Neutral"
          : "Neutral"),
    }));
  };

  // ---------- Load all ----------
  async function loadAll() {
    setLoading(true);
    setProgress(0);
    setEta(0);
    const started = Date.now();

    const fetcher = async (url, body) => {
      try {
        const r = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        return await r.json();
      } catch {
        return {};
      }
    };

    try {
      const [sShort, sMed, sLong, sHidden] = await Promise.all([
        fetcher("/api/screener", { horizon: "short" }),
        fetcher("/api/screener", { horizon: "medium" }),
        fetcher("/api/screener", { horizon: "long" }),
        fetcher("/api/hidden-gems"),
      ]);

      const short = sShort?.results || [];
      const medium = sMed?.results || [];
      const long = sLong?.results || [];
      const hiddenData = sHidden?.results || [];

      // --- AI Picks ทั้งตลาด + Progress ---
      const pageSize = 100;
      const maxPages = 20;
      let off = 0;
      let ai = [];
      for (let i = 0; i < maxPages; i++) {
        const r = await fetch(
          `/api/ai-picks?limit=${pageSize}&offset=${off}&nocache=1`
        ).then((x) => x.json().catch(() => ({})));
        const chunk = Array.isArray(r?.results) ? r.results : [];
        ai = ai.concat(chunk);

        const pct = ((i + 1) / maxPages) * 100;
        setProgress(pct);
        const elapsed = (Date.now() - started) / 1000;
        const estTotal = (elapsed / (i + 1)) * maxPages;
        setEta(Math.max(estTotal - elapsed, 0));

        if (chunk.length < pageSize) break;
        off += pageSize;
        await sleep(120);
      }

      // เติมราคา/RSI ให้หน้าแรก AI Picks
      await Promise.all(
        ai.slice(0, 40).map(async (row) => {
          const sym = row.symbol || row.ticker;
          if (!sym) return;
          try {
            const r = await fetch(`/api/price?symbol=${encodeURIComponent(sym)}`);
            const j = await r.json().catch(() => ({}));
            row.price = j.price ?? row.price ?? row.last ?? 0;
            row.rsi = j.rsi ?? row.rsi ?? "-";
            row.signal = j.signal ?? row.signal ?? "-";
            row.target = j.target ?? row.target ?? null;
            row.confidence = j.confidence ?? row.confidence ?? null;
            row.predictedMove = j.predictedMove ?? row.predictedMove ?? null;
          } catch {}
        })
      );

      // News
      const newsRaw = await fetch("/api/news")
        .then((x) => x.json().catch(() => ({})))
        .catch(() => ({}));

      setDataShort(short);
      setDataMedium(medium);
      setDataLong(long);
      setHidden(hiddenData);
      setAiPicks(ai);
      setNewsFeed(normalizeNews(newsRaw));
      setError("");
    } catch (e) {
      console.error(e);
      setError("Load failed");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 600);
      setEta(0);
    }
  }

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ---------- Favorite Stock ----------
  async function fetchYahooPrice(symbol) {
    try {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      const j = await r.json().catch(() => ({}));
      setFavoritePrices((p) => ({
        ...p,
        [symbol]: {
          price: j.price ?? 0,
          rsi: j.rsi ?? "-",
          signal: j.signal ?? "-",
          target: j.target ?? null,
          confidence: j.confidence ?? null,
          predictedMove: j.predictedMove ?? null,
        },
      }));
    } catch (err) {
      console.error("fetchYahooPrice error:", err);
    }
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

  // ---------- Table ----------
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
            <th className="p-2">🎯 Target</th>
            <th className="p-2">🤖 AI %</th>
            <th className="p-2">🔮 3D Move</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="8" className="p-3 text-gray-500">
                No data available.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const sym = r.symbol || r.ticker || "";
              if (!sym) return null;
              const fav = favorites.includes(sym);

              const priceRaw =
                r.price ??
                r.lastClose ??
                r.close ??
                r.last ??
                favoritePrices[sym]?.price ??
                "-";

              const rsi = r.rsi ?? favoritePrices[sym]?.rsi ?? "-";
              const sig = r.signal ?? favoritePrices[sym]?.signal ?? "-";
              const color =
                sig === "Buy"
                  ? "text-green-400"
                  : sig === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400";

              return (
                <tr
                  key={sym + i}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td
                    onClick={() => toggleFavorite(sym)}
                    className="cursor-pointer text-yellow-400 pl-4 select-none"
                  >
                    {fav ? "★" : "☆"}
                  </td>
                  <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                    <a href={`/analyze/${sym}`}>{sym}</a>
                  </td>
                  <td className="p-2 font-mono">
                    {priceRaw !== "-" ? `$${Number(priceRaw).toFixed(2)}` : "-"}
                  </td>
                  <td className="p-2">
                    {typeof rsi === "number" ? Math.round(rsi) : rsi}
                  </td>
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <b className="text-emerald-400 text-lg">🌍 Visionary Stock Screener</b>
          <button
            onClick={loadAll}
            className="bg-emerald-500/10 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 text-sm font-semibold"
          >
            {loading ? "Loading..." : "🔁 Refresh"}
          </button>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <>
            <div className="w-full bg-[#1a2335] h-2">
              <div
                className="bg-emerald-400 h-2 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center text-xs text-emerald-300 py-1">
              🔍 Scanning Stocks... {Math.round(progress)}%
            </div>
          </>
        )}
      </header>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        {activeTab === "market" && (
          <>
            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-emerald-400/30">
              <h2 className="text-emerald-400 mb-2 font-semibold text-lg">
                🤖 AI Picks — Smart Buy Signals
              </h2>
              <Table rows={aiPicks.slice(0, 20)} />
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

        {activeTab === "alerts" && (
          <>
            <AlertSystem />
            <AutoMarketScan /> {/* ✅ ใช้ component ใหม่ */}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "favorites" ? "text-blue-400" : ""
          }`}
        >
          💙 Favorites
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "market" ? "text-blue-400" : ""
          }`}
        >
          🌐 Market
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "alerts" ? "text-emerald-400" : ""
          }`}
        >
          🔔 Alerts
        </button>
      </nav>
    </main>
  );
     }
