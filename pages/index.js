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

  // ---------- LocalStorage: favorites ----------
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ---------- Helpers ----------
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

      // AI picks พร้อม progress
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
      setProgress(100);
      setEta(0);

      // เติมราคา/RSI/สัญญาณให้หน้าแรกของ AI Picks เพื่อลื่น
      await Promise.all(
        ai.slice(0, 40).map(async (row) => {
          const sym = row.symbol || row.ticker;
          if (!sym) return;
          try {
            const r = await fetch(`/api/price?symbol=${encodeURIComponent(sym)}`);
            const j = await r.json().catch(() => ({}));
            row.price = j.price ?? row.price ?? row.last ?? row.lastClose ?? 0;
            row.rsi = j.rsi ?? row.rsi ?? "-";
            row.signal = j.signal ?? row.signal ?? "-";
          } catch {}
        })
      );

      // News
      const newsRaw = await fetch("/api/news")
        .then((x) => x.json().catch(() => ({})))
        .catch(() => ({}));
      const normalizedNews = normalizeNews(newsRaw);

      setDataShort(short);
      setDataMedium(medium);
      setDataLong(long);
      setHidden(hiddenData);
      setAiPicks(ai);
      setNewsFeed(normalizedNews);
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

  // ---------- Favorites ----------
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

  // ---------- Table (เพิ่ม Target / AI% / 3D Move) ----------
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
              <td colSpan="8" className="p-3 text-gray-500">No data available.</td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const sym = r.symbol || r.ticker || r.Symbol || "";
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
                sig === "Buy" ? "text-green-400" : sig === "Sell" ? "text-red-400" : "text-yellow-400";

              const targetTxt = r.target ? `$${Number(r.target).toFixed(2)}` : "-";
              const confTxt = typeof r.confidence === "number" ? `${r.confidence.toFixed(0)}%` : "-";
              const moveNum =
                typeof r.predictedMove === "number"
                  ? r.predictedMove
                  : typeof r.predicted_move === "number"
                  ? r.predicted_move
                  : null;
              const moveTxt = moveNum === null ? "-" : `${moveNum > 0 ? "+" : ""}${moveNum}%`;
              const moveColor =
                moveNum > 0 ? "text-green-400" : moveNum < 0 ? "text-red-400" : "text-gray-400";

              return (
                <tr key={sym + i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td onClick={() => toggleFavorite(sym)} className="cursor-pointer text-yellow-400 pl-4 select-none">
                    {fav ? "★" : "☆"}
                  </td>
                  <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                    <a href={`/analyze/${sym}`}>{sym}</a>
                  </td>
                  <td className="p-2 font-mono">{priceRaw !== "-" ? `$${Number(priceRaw).toFixed(2)}` : "-"}</td>
                  <td className="p-2">{typeof rsi === "number" ? Math.round(rsi) : rsi}</td>
                  <td className={`p-2 font-semibold ${color}`}>{sig}</td>
                  <td className="p-2 text-emerald-300">{targetTxt}</td>
                  <td className="p-2 text-cyan-300">{confTxt}</td>
                  <td className={`p-2 font-semibold ${moveColor}`}>{moveTxt}</td>
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
            <b className="text-emerald-400 text-lg sm:text-xl">🌍 Visionary Stock Screener</b>
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

        {/* Progress */}
        {progress > 0 && (
          <>
            <div className="w-full bg-[#1a2335] h-2">
              <div className="bg-emerald-400 h-2 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-center text-xs text-emerald-300 py-1">
              🔍 Scanning Stocks... {Math.round(progress)}%{" "}
              {eta > 0 && <span className="text-gray-400 ml-1">⏱ ~{Math.round(eta)}s</span>}
            </div>
          </>
        )}
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        {activeTab === "market" && (
          <>
            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-emerald-400/30">
              <h2 className="text-emerald-400 mb-2 font-semibold text-lg">🤖 AI Picks — Smart Buy Signals</h2>
              <Table rows={aiPicks.slice(0, 20)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-green-400 mb-2 font-semibold text-lg">⚡ Fast Movers</h2>
              <Table rows={dataShort.slice(0, 6)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-yellow-400 mb-2 font-semibold text-lg">🌱 Emerging Trends</h2>
              <Table rows={dataMedium.slice(0, 6)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
              <h2 className="text-sky-400 mb-2 font-semibold text-lg">🚀 Future Leaders</h2>
              <Table rows={dataLong.slice(0, 6)} />
            </section>

            <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-cyan-400/30">
              <h2 className="text-cyan-300 mb-2 font-semibold text-lg">💎 Hidden Gems</h2>
              <Table rows={hidden.slice(0, 6)} />
            </section>
          </>
        )}

        {activeTab === "favorites" && (
          <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-yellow-300 text-lg font-semibold">⭐ My Favorites</h2>
              <button onClick={clearFavorites} className="text-sm text-red-400 hover:text-red-300 underline">
                Clear All
              </button>
            </div>
            <Table rows={favoriteData} />
          </section>
        )}

        {activeTab === "news" && (
          <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-purple-400/30">
            <h2 className="text-purple-400 text-xl font-semibold mb-4">🧠 AI Market News — Early Signals</h2>
            {newsFeed.length === 0 ? (
              <div className="text-center text-gray-400">No news data available.</div>
            ) : (
              newsFeed.slice(0, 12).map((n, i) => (
                <div key={i} className="border border-white/10 bg-[#0e1628]/80 rounded-xl p-4 mb-3">
                  <div className="flex justify-between text-[12px] text-gray-400 mb-1">
                    <span className="text-sky-400 font-semibold">{n.symbol}</span>
                    <span>{n.time}</span>
                  </div>
                  <div className="text-[15px] font-medium text-emerald-300 mb-1">{n.title}</div>
                  <div className="text-[13px] text-gray-400 mb-2">{n.publisher}</div>
                  <span
                    className={`text-xs font-semibold ${
                      n.sentiment === "Positive"
                        ? "text-green-400"
                        : n.sentiment === "Negative"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {n.sentiment}
                  </span>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === "menu" && (
          <section className="text-center text-gray-400 py-10">
            <h2 className="text-emerald-400 text-xl mb-3 font-semibold">⚙️ Settings & Info</h2>
            <p>📡 Auto refresh every 10 minutes</p>
            <p>💾 Favorites stored locally</p>
            <div className="text-xs text-gray-500 mt-3">Version 1.0.7</div>
          </section>
        )}
      </div>

      {/* Bottom nav (ครบ 4 ปุ่ม) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`py-2 flex flex-col items-center ${activeTab === "favorites" ? "text-blue-400" : ""}`}
        >
          <span className="text-[18px]">💙</span>
          Favorites
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`py-2 flex flex-col items-center ${activeTab === "market" ? "text-blue-400" : ""}`}
        >
          <span className="text-[18px]">🌐</span>
          Market
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`py-2 flex flex-col items-center ${activeTab === "news" ? "text-purple-400" : ""}`}
        >
          <span className="text-[18px]">🧠</span>
          News
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`py-2 flex flex-col items-center ${activeTab === "menu" ? "text-blue-400" : ""}`}
        >
          <span className="text-[18px]">☰</span>
          Menu
        </button>
      </nav>
    </main>
  );
        }
