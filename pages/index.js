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

      // เติมราคา/RSI/สัญญาณให้หน้าแรกของ AI Picks
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
                    {priceRaw !== "-" ? `$${Number(priceRaw).toFixed(2)}` : "-"}
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
        {activeTab === "alerts" && <AlertSystem />}

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

      {/* ✅ Bottom nav (เพิ่มปุ่ม Alerts แล้ว) */}
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

// ---------- ✅ ระบบแจ้งเตือนหุ้น ----------
import { useEffect as useEff, useState as useSt } from "react";

function AlertSystem() {
  const [alerts, setAlerts] = useSt([]);
  const [symbol, setSymbol] = useSt("");
  const [type, setType] = useSt("price_above");
  const [value, setValue] = useSt("");
  const [messages, setMessages] = useSt([]);

  // โหลดจาก localStorage
  useEff(() => {
    const saved = localStorage.getItem("alerts");
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  useEff(() => {
    localStorage.setItem("alerts", JSON.stringify(alerts));
  }, [alerts]);

  // ตรวจทุก 1 นาที
  useEff(() => {
    const checkAlerts = async () => {
      for (const a of alerts) {
        try {
          const r = await fetch(`/api/price?symbol=${encodeURIComponent(a.symbol)}`);
          const j = await r.json();
          const price = j.price ?? 0;
          const rsi = j.rsi ?? 50;
          const sig = j.signal ?? "Neutral";
          let hit = false;

          if (a.type === "price_above" && price > a.value) hit = true;
          if (a.type === "price_below" && price < a.value) hit = true;
          if (a.type === "rsi_above" && rsi > a.value) hit = true;
          if (a.type === "rsi_below" && rsi < a.value) hit = true;
          if (a.type === "ai_is" && sig.toLowerCase() === a.value.toLowerCase())
            hit = true;

          if (hit) {
            const msg = `⚡ ${a.symbol} ${a.type.replace("_", " ")} ${a.value}`;
            if (!messages.find((m) => m.msg === msg)) {
              setMessages((prev) => [...prev, { id: Date.now(), msg }]);
            }
          }
        } catch {}
      }
    };

    checkAlerts();
    const id = setInterval(checkAlerts, 60000);
    return () => clearInterval(id);
  }, [alerts]);

  // ลบ toast หลัง 6 วิ
  useEff(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }, 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mb-6 border border-emerald-400/30">
      <h2 className="text-emerald-400 text-lg font-semibold mb-2">
        🔔 Stock Alerts
      </h2>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="bg-[#141b2d] px-2 py-1 rounded w-24"
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
          <option value="ai_is">AI Signal =</option>
        </select>
        <input
          className="bg-[#141b2d] px-2 py-1 rounded w-24"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          onClick={() => {
            if (!symbol || !value) return;
            setAlerts((p) => [
              ...p,
              { id: Date.now(), symbol, type, value: parseFloat(value) || value },
            ]);
            setSymbol("");
            setValue("");
          }}
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
                {a.symbol} — {a.type} {a.value}
              </span>
              <button
                onClick={() =>
                  setAlerts((p) => p.filter((x) => x.id !== a.id))
                }
                className="text-red-400 hover:text-red-300 text-xs underline"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Toast แจ้งเตือน */}
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
// ---------- Auto Scan: สแกนหุ้นสหรัฐทั้งตลาด + แจ้งเตือนอัตโนมัติ ----------
import { useEffect as useEff2, useState as useSt2 } from "react";

function AutoMarketScan() {
  // ตั้งค่า
  const [enabled, setEnabled] = useSt2(false);
  const [aiSignal, setAiSignal] = useSt2("Buy"); // Buy / Sell / Neutral / Any
  const [rsiMin, setRsiMin] = useSt2("");
  const [rsiMax, setRsiMax] = useSt2("");
  const [priceMin, setPriceMin] = useSt2("");
  const [priceMax, setPriceMax] = useSt2("");
  const [pages, setPages]   = useSt2(25);   // จำนวนหน้าที่จะไล่สแกน (limit=200 ต่อหน้า)
  const [everyMin, setEveryMin] = useSt2(5); // สแกนซ้ำทุกกี่นาที
  const [scanProg, setScanProg] = useSt2(0);
  const [hits, setHits] = useSt2([]);       // รายการที่เข้าเงื่อนไขล่าสุด
  const [messages, setMessages] = useSt2([]); // toast ภายใน component นี้

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // beep เสียงสั้น ๆ ตอนเจอ
  const beep = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 850;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 180);
    } catch {}
  };

  // โหลด/บันทึกค่าลง localStorage
  useEff2(() => {
    const saved = localStorage.getItem("autoScanSettings");
    if (saved) {
      try {
        const j = JSON.parse(saved);
        if (typeof j.enabled === "boolean") setEnabled(j.enabled);
        if (j.aiSignal) setAiSignal(j.aiSignal);
        if (j.rsiMin !== undefined) setRsiMin(j.rsiMin);
        if (j.rsiMax !== undefined) setRsiMax(j.rsiMax);
        if (j.priceMin !== undefined) setPriceMin(j.priceMin);
        if (j.priceMax !== undefined) setPriceMax(j.priceMax);
        if (j.pages) setPages(j.pages);
        if (j.everyMin) setEveryMin(j.everyMin);
      } catch {}
    }
  }, []);
  useEff2(() => {
    localStorage.setItem(
      "autoScanSettings",
      JSON.stringify({ enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax, pages, everyMin })
    );
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax, pages, everyMin]);

  // เงื่อนไขคัดกรอง
  const matchRow = (row) => {
    const price = row.price ?? row.lastClose ?? row.close ?? row.last ?? 0;
    const rsi   = typeof row.rsi === "number" ? row.rsi : (typeof row.RSI === "number" ? row.RSI : null);
    const sig   = (row.signal || row.ai || row.AI || "-").toString();

    if (aiSignal !== "Any" && sig.toLowerCase() !== aiSignal.toLowerCase()) return false;
    if (rsiMin !== "" && rsi != null && rsi < Number(rsiMin)) return false;
    if (rsiMax !== "" && rsi != null && rsi > Number(rsiMax)) return false;
    if (priceMin !== "" && price < Number(priceMin)) return false;
    if (priceMax !== "" && price > Number(priceMax)) return false;
    return true;
  };

  // สแกนทั้งตลาดจาก /api/ai-picks (มีแบ่งหน้าอยู่แล้ว)
  const runScan = async () => {
    if (!enabled) return;
    setScanProg(0);
    let off = 0;
    let found = [];
    const limit = 200;
    for (let i = 0; i < Math.max(1, Number(pages)); i++) {
      let r;
      try {
        r = await fetch(`/api/ai-picks?limit=${limit}&offset=${off}&nocache=1`)
          .then((x) => x.json())
          .catch(() => ({}));
      } catch {
        r = {};
      }
      const arr = Array.isArray(r?.results) ? r.results : [];

      for (const row of arr) {
        if (matchRow(row)) {
          const sym = row.symbol || row.ticker || row.Symbol;
          if (sym) {
            const msg = `⚡ ${sym} hit: AI=${row.signal || "-"} | P=${(row.price ?? row.lastClose ?? 0)} | RSI=${row.rsi ?? "-"}`;
            // กันซ้ำในรอบเดียว
            if (!found.find((x) => x.sym === sym)) {
              found.push({ sym, msg });
              setMessages((prev) => [...prev, { id: Date.now() + Math.random(), msg }]);
              beep();
            }
          }
        }
      }

      setScanProg(Math.round(((i + 1) / Math.max(1, Number(pages))) * 100));
      if (arr.length < limit) break; // หมดหน้าแล้ว
      off += limit;
      await sleep(120);
    }
    setHits(found.slice(0, 30));
  };

  // auto run ตามรอบเวลา
  useEff2(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, Math.max(1, Number(everyMin)) * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax, pages, everyMin]);

  // Toast auto hide
  useEff2(() => {
    if (!messages.length) return;
    const ids = messages.map((m) =>
      setTimeout(() => {
        setMessages((p) => p.filter((x) => x.id !== m.id));
      }, 5500)
    );
    return () => ids.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#0f172a]/80 rounded-2xl p-4 mb-6 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-3">🛰️ Auto Scan — US Market</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="text-emerald-300 font-semibold">Enable</span>
        </label>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">AI Signal</div>
          <select
            className="bg-[#0b1220] w-full rounded px-2 py-1"
            value={aiSignal}
            onChange={(e) => setAiSignal(e.target.value)}
          >
            <option>Buy</option>
            <option>Sell</option>
            <option>Neutral</option>
            <option>Any</option>
          </select>
        </div>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">RSI Min</div>
          <input className="bg-[#0b1220] w-full rounded px-2 py-1" value={rsiMin} onChange={(e) => setRsiMin(e.target.value)} />
        </div>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">RSI Max</div>
          <input className="bg-[#0b1220] w-full rounded px-2 py-1" value={rsiMax} onChange={(e) => setRsiMax(e.target.value)} />
        </div>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">Price Min</div>
          <input className="bg-[#0b1220] w-full rounded px-2 py-1" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
        </div>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">Price Max</div>
          <input className="bg-[#0b1220] w-full rounded px-2 py-1" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </div>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">Pages (×200)</div>
          <input className="bg-[#0b1220] w-full rounded px-2 py-1" value={pages} onChange={(e) => setPages(e.target.value)} />
        </div>

        <div className="bg-[#141b2d] px-3 py-2 rounded">
          <div className="text-xs text-gray-400 mb-1">Scan every (min)</div>
          <input className="bg-[#0b1220] w-full rounded px-2 py-1" value={everyMin} onChange={(e) => setEveryMin(e.target.value)} />
        </div>

        <button
          onClick={runScan}
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold"
        >
          ▶️ Run now
        </button>
      </div>

      {/* Progress */}
      {enabled && (
        <div className="mt-3">
          <div className="w-full bg-[#1a2335] h-2 rounded">
            <div className="bg-cyan-400 h-2 rounded" style={{ width: `${scanProg}%` }} />
          </div>
          <div className="text-xs text-cyan-300 mt-1">Scanning... {scanProg}%</div>
        </div>
      )}

      {/* Last hits */}
      <div className="mt-4">
        <h3 className="text-cyan-200 text-sm font-semibold mb-2">Latest matches</h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบที่เข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li key={i} className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2">
                {h.msg}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Toast */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-cyan-400/40 text-cyan-100 px-3 py-2 rounded shadow"
          >
            {m.msg}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- ใส่ AutoMarketScan เข้าไปในหน้า Alerts เดิม (เพิ่มบรรทัดเดียว) ----------
// เปิดไฟล์เดียวกัน หา export function AlertsTab() { ... } ที่คุณมีอยู่
// แล้ว "เพิ่ม" <AutoMarketScan /> ต่อจาก <AlertSystem /> ได้เลย เช่น:
// ...
//   <div className="max-w-4xl mx-auto px-4 py-6">
//     <AlertSystem />
//     <AutoMarketScan />   // <-- เพิ่มบรรทัดนี้
//   </div>
// ...
