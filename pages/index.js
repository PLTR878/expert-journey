import { useEffect, useState } from "react";

/* =========================================================
   🌍 Visionary Stock Screener — FULL
   - Tabs: Market, Favorites, News, Alerts, Menu
   - AI Picks + Screener + Hidden Gems
   - Alerts (Price/RSI) + Auto Scan ทั้งตลาด
   - Toast + Beep + LocalStorage + Progress Bar
========================================================= */

// (alias ภายในไฟล์เดียว ไม่ต้อง import ซ้ำ)
const useEff = useEffect;
const useSt = useState;

/* =========================
   🏠 HOME PAGE
========================= */
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

  // ---------- Favorites ----------
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
                sig === "Buy"
                  ? "text-green-400"
                  : sig === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400";

              const targetVal = r.target ?? favoritePrices[sym]?.target ?? null;
              const targetTxt =
                targetVal != null ? `$${Number(targetVal).toFixed(2)}` : "-";

              const confVal =
                r.confidence ?? favoritePrices[sym]?.confidence ?? null;
              const confTxt =
                typeof confVal === "number" ? `${confVal.toFixed(0)}%` : "-";

              const moveNum =
                (typeof r.predictedMove === "number"
                  ? r.predictedMove
                  : typeof r.predicted_move === "number"
                  ? r.predicted_move
                  : favoritePrices[sym]?.predictedMove) ?? null;
              const moveTxt =
                moveNum === null ? "-" : `${moveNum > 0 ? "+" : ""}${moveNum}%`;
              const moveColor =
                moveNum > 0
                  ? "text-green-400"
                  : moveNum < 0
                  ? "text-red-400"
                  : "text-gray-400";

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
                    {priceRaw !== "-"
                      ? `$${Number(priceRaw).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="p-2">
                    {typeof rsi === "number" ? Math.round(rsi) : rsi}
                  </td>
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

        {/* Progress */}
        {progress > 0 && (
          <>
            <div className="w-full bg-[#1a2335] h-2">
              <div
                className="bg-emerald-400 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center text-xs text-emerald-300 py-1">
              🔍 Scanning Stocks... {Math.round(progress)}%{" "}
              {eta > 0 && (
                <span className="text-gray-400 ml-1">
                  ⏱ ~{Math.round(eta)}s
                </span>
              )}
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
              <div className="text-center text-gray-400">
                No news data available.
              </div>
            ) : (
              newsFeed.slice(0, 12).map((n, i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-[#0e1628]/80 rounded-xl p-4 mb-3"
                >
                  <div className="flex justify-between text-[12px] text-gray-400 mb-1">
                    <span className="text-sky-400 font-semibold">
                      {n.symbol}
                    </span>
                    <span>{n.time}</span>
                  </div>
                  <div className="text-[15px] font-medium text-emerald-300 mb-1">
                    {n.title}
                  </div>
                  <div className="text-[13px] text-gray-400 mb-2">
                    {n.publisher}
                  </div>
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

        {/* ✅ แท็บแจ้งเตือน */}
        {activeTab === "alerts" && (
          <>
            <AlertSystem />
            <AutoMarketScan />
          </>
        )}

        {activeTab === "menu" && (
          <section className="text-center text-gray-400 py-10">
            <h2 className="text-emerald-400 text-xl mb-3 font-semibold">
              ⚙️ Settings & Info
            </h2>
            <p>📡 Auto refresh every 10 minutes</p>
            <p>💾 Favorites stored locally</p>
            <p>🔔 Alerts check every 1 minute</p>
            <div className="text-xs text-gray-500 mt-3">Version 1.1.0</div>
          </section>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "favorites" ? "text-blue-400" : ""
          }`}
        >
          <span className="text-[18px]">💙</span>
          Favorites
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "market" ? "text-blue-400" : ""
          }`}
        >
          <span className="text-[18px]">🌐</span>
          Market
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "news" ? "text-purple-400" : ""
          }`}
        >
          <span className="text-[18px]">🧠</span>
          News
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "alerts" ? "text-emerald-400" : ""
          }`}
        >
          <span className="text-[18px]">🔔</span>
          Alerts
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "menu" ? "text-blue-400" : ""
          }`}
        >
          <span className="text-[18px]">☰</span>
          Menu
        </button>
      </nav>
    </main>
  );
}

/* =========================
   🔔 ALERT SYSTEM
========================= */
function AlertSystem() {
  const [alerts, setAlerts] = useSt([]);
  const [symbol, setSymbol] = useSt("");
  const [type, setType] = useSt("price_above");
  const [value, setValue] = useSt("");
  const [messages, setMessages] = useSt([]);

  // โหลด/บันทึก localStorage
  useEff(() => {
    const saved = localStorage.getItem("alerts");
    if (saved) setAlerts(JSON.parse(saved));
  }, []);
  useEff(() => {
    localStorage.setItem("alerts", JSON.stringify(alerts));
  }, [alerts]);

    // ตรวจทุก 1 นาที
  useEff(() => {
    const beep = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    };

    const checkAlerts = async () => {
      for (const a of alerts) {
        try {
          const r = await fetch(`/api/price?symbol=${encodeURIComponent(a.symbol)}`);
          const j = await r.json();
          const price = j.price ?? 0;
          const rsi = j.rsi ?? 50;
          let hit = false;

          if (a.type === "price_above" && price > a.value) hit = true;
          if (a.type === "price_below" && price < a.value) hit = true;
          if (a.type === "rsi_above" && rsi > a.value) hit = true;
          if (a.type === "rsi_below" && rsi < a.value) hit = true;

          if (hit) {
            const msg = `⚡ ${a.symbol} ${a.type.replace("_", " ")} ${a.value} (now $${price})`;
            setMessages((p) => [...p, { id: Date.now(), msg }]);
            beep();
          }
        } catch {}
      }
    };

    checkAlerts();
    const id = setInterval(checkAlerts, 60 * 1000);
    return () => clearInterval(id);
  }, [alerts]);

  // Toast auto-remove
  useEff(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }, 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  // Add alert
  const addAlert = () => {
    if (!symbol || !value) return alert("กรอก Symbol และ Value");
    setAlerts((p) => [
      ...p,
      { id: Date.now(), symbol: symbol.toUpperCase(), type, value: Number(value) },
    ]);
    setSymbol("");
    setValue("");
  };

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mb-6 border border-emerald-400/30">
      <h2 className="text-emerald-400 text-lg font-semibold mb-2">🔔 Stock Alerts</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="bg-[#141b2d] px-2 py-1 rounded w-28"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <select
          className="bg-[#141b2d] px-2 py-1 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="price_above">Price &gt;</option>
          <option value="price_below">Price &lt;</option>
          <option value="rsi_above">RSI &gt;</option>
          <option value="rsi_below">RSI &lt;</option>
        </select>
        <input
          className="bg-[#141b2d] px-2 py-1 rounded w-24"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          onClick={addAlert}
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-1 text-emerald-300"
        >
          ➕ Add
        </button>
      </div>

      <ul className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-gray-400">ยังไม่มีแจ้งเตือน</div>
        ) : (
          alerts.map((a) => (
            <li
              key={a.id}
              className="flex justify-between items-center bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2 text-sm"
            >
              <span className="text-emerald-200">
                {a.symbol} — {a.type.replace("_", " ")} {a.value}
              </span>
              <button
                onClick={() => setAlerts((p) => p.filter((x) => x.id !== a.id))}
                className="text-red-400 hover:text-red-300 text-xs underline"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Toast */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-emerald-400/30 text-emerald-200 px-3 py-2 rounded shadow"
          >
            {m.msg}
          </div>
        ))}
      </div>
    </section>
  );
}
(-40), `⚡ พบ ${s.symbol} | ${s.signal} | RSI=${rsi}`]);
            beep();
            vibrate();
          }
        }
        setProgress(Math.round(((i + 1) / totalPages) * 100));
        await new Promise((r) => setTimeout(r, 150));
      }

      setLogs((prev) => [...prev, "✅ สแกนครบทุกหุ้นแล้ว"]);
    } catch (err) {
      console.error(err);
      setLogs((prev) => [...prev, "❌ เกิดข้อผิดพลาดในการสแกน"]);
    }
  };
   /* =========================
   🛰️ AUTO SCAN ทั้งตลาด (AI) — SAFE VERSION
========================= */
function AutoMarketScan() {
  const [enabled, setEnabled] = useSt(false);
  const [aiSignal, setAiSignal] = useSt("Any");
  const [rsiMin, setRsiMin] = useSt("25");
  const [rsiMax, setRsiMax] = useSt("70");
  const [priceMin, setPriceMin] = useSt("0.5");
  const [priceMax, setPriceMax] = useSt("100");
  const [progress, setProgress] = useSt(0);
  const [logs, setLogs] = useSt([]);
  const [hits, setHits] = useSt([]);
  const [scannedCount, setScannedCount] = useSt(0);
  const [totalStocks, setTotalStocks] = useSt(0);
  const [foundCount, setFoundCount] = useSt(0);

  // 🔊 เสียงเตือน
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 180);
    } catch (err) {
      console.error("Beep error:", err);
    }
  };

  // 📳 สั่นมือถือ (ถ้ามี)
  const vibrate = (ms = 200) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // 🚀 เริ่มสแกน
  const runScan = async () => {
    if (!enabled) return;

    setLogs(["🚀 เริ่มสแกนตลาดหุ้นอเมริกา..."]);
    setProgress(0);
    setHits([]);
    setScannedCount(0);
    setFoundCount(0);

    try {
      const totalPages = 25; // 25 หน้า x 200 หุ้น = 5000 หุ้น
      const limit = 200;
      const totalExpected = totalPages * limit;
      setTotalStocks(totalExpected);

      for (let i = 0; i < totalPages; i++) {
        const res = await fetch(`/api/ai-picks?limit=${limit}&offset=${i * limit}&nocache=1`);
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.results) ? data.results : [];

        setScannedCount((prev) => prev + list.length);

        for (const s of list) {
          const sig = String(s.signal || "").toLowerCase();
          const rsi = s.rsi ?? 50;
          const price = s.price ?? 0;

          if (
            (aiSignal === "Any" || sig === aiSignal.toLowerCase()) &&
            rsi >= Number(rsiMin) &&
            rsi <= Number(rsiMax) &&
            price >= Number(priceMin) &&
            price <= Number(priceMax)
          ) {
            const hit = { symbol: s.symbol, ai: s.signal, rsi, price };
            setHits((p) => [...p.slice(-25), hit]);
            setLogs((p) => [...p.slice(-60), `⚡ พบ ${s.symbol} | ${s.signal} | RSI=${rsi}`]);
            setFoundCount((prev) => prev + 1);
            beep();
            vibrate();
          }
        }

        setProgress(Math.round(((i + 1) / totalPages) * 100));
        await new Promise((r) => setTimeout(r, 120));
      }

      setLogs((p) => [...p, "✅ สแกนครบทุกหุ้นแล้ว"]);
      setProgress(100);
    } catch (err) {
      console.error("Scan error:", err);
      setLogs((p) => [...p, `❌ Error: ${err.message}`]);
    }
  };

  // 🔁 Auto run ทุก 5 นาที
  useEff(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">
        🛰️ Auto Scan — US Stocks
      </h2>

      {/* 🧩 Control Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="text-emerald-300 font-semibold">Enable</span>
        </label>

        <select
          className="bg-[#141b2d] px-2 py-1 rounded"
          value={aiSignal}
          onChange={(e) => setAiSignal(e.target.value)}
        >
          <option>Buy</option>
          <option>Sell</option>
          <option>Neutral</option>
          <option>Any</option>
        </select>

        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="RSI Min"
          value={rsiMin}
          onChange={(e) => setRsiMin(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="RSI Max"
          value={rsiMax}
          onChange={(e) => setRsiMax(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="Price Min"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="Price Max"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
        <button
          onClick={runScan}
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold"
        >
          ▶️ Run Now
        </button>
      </div>

      {/* 📊 Progress */}
      <div className="w-full bg-[#1a2335] h-2 rounded mt-1">
        <div
          className="bg-cyan-400 h-2 rounded transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-cyan-300 mt-1">
        Scanning... {progress}% ({scannedCount.toLocaleString()} /{" "}
        {totalStocks.toLocaleString()} stocks)
      </div>

      <div className="text-xs text-emerald-300 mt-1">
        ✅ พบทั้งหมด {foundCount} หุ้นเข้าเงื่อนไข
      </div>

      {/* 🧠 Log Panel */}
      <div className="bg-[#0d1423]/60 p-2 mt-3 rounded text-[12px] text-gray-300 h-28 overflow-y-auto font-mono">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* ⚡ Results */}
      <div className="mt-3">
        <h3 className="text-cyan-200 text-sm font-semibold mb-1">
          Latest Matches ({hits.length})
        </h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบหุ้นเข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-1.5"
              >
                ⚡ {h.symbol} | {h.ai} | RSI={h.rsi} | ${h.price}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
  }
