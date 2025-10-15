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

  // ---------- Alerts ----------
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const uid = () => Math.random().toString(36).slice(2, 9);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((j) => setAlerts(j.results || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch("/api/alerts/runner");
        const j = await r.json().catch(() => ({}));
        if (Array.isArray(j.results) && j.results.length) {
          setToasts((prev) => [
            ...prev,
            ...j.results.map((h) => ({ id: uid(), msg: h.message })),
          ]);
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((p) => p.filter((x) => x.id !== t.id));
      }, 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

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
                r.price ?? r.lastClose ?? r.close ?? r.last ?? favoritePrices[sym]?.price ?? "-";
              const rsi = r.rsi ?? favoritePrices[sym]?.rsi ?? "-";
              const sig = r.signal ?? favoritePrices[sym]?.signal ?? "-";
              const color =
                sig === "Buy"
                  ? "text-green-400"
                  : sig === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400";
              const targetVal = r.target ?? favoritePrices[sym]?.target ?? null;
              const targetTxt = targetVal != null ? `$${Number(targetVal).toFixed(2)}` : "-";
              const confVal = r.confidence ?? favoritePrices[sym]?.confidence ?? null;
              const confTxt = typeof confVal === "number" ? `${confVal.toFixed(0)}%` : "-";
              const moveNum =
                (typeof r.predictedMove === "number"
                  ? r.predictedMove
                  : typeof r.predicted_move === "number"
                  ? r.predicted_move
                  : favoritePrices[sym]?.predictedMove) ?? null;
              const moveTxt = moveNum === null ? "-" : `${moveNum > 0 ? "+" : ""}${moveNum}%`;
              const moveColor =
                moveNum > 0 ? "text-green-400" : moveNum < 0 ? "text-red-400" : "text-gray-400";
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
      {/* Toast แจ้งเตือน */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-[#101827]/90 border border-emerald-400/30 text-emerald-200 px-3 py-2 rounded shadow"
          >
            {t.msg}
          </div>
        ))}
      </div>

      {/* ...ส่วนอื่นๆ ของหน้า เช่น header, table, menu เหมือนเดิม... */}

      {/* หน้าแจ้งเตือน */}
      {activeTab === "menu" && (
        <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-emerald-400/30">
          <h2 className="text-emerald-400 text-xl font-semibold mb-3">🔔 Stock Alerts</h2>
          <AlertForm onAdd={(a) => setAlerts((p) => [a, ...p])} />
          <AlertList
            alerts={alerts}
            onDelete={(id) => setAlerts((p) => p.filter((x) => x.id !== id))}
          />
        </section>
      )}
    </main>
  );
}

function AlertForm({ onAdd }) {
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("price_above");
  const [value, setValue] = useState("");

  return (
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
          if (!symbol) return;
          onAdd({ id: Date.now(), symbol, type, value });
          setSymbol("");
          setValue("");
        }}
        className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-1 text-emerald-300"
      >
        ➕ Add
      </button>
    </div>
  );
}

function AlertList({ alerts, onDelete }) {
  return alerts.length === 0 ? (
    <div className="text-gray-400">ยังไม่มีแจ้งเตือน</div>
  ) : (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li
          key={a.id}
          className="flex items-center justify-between bg-[#0e1628] border border-white/10 rounded-lg px-3 py-2"
        >
          <div className="text-sm text-emerald-200">
            {a.symbol} — {a.type} {a.value}
          </div>
          <button
            onClick={() => onDelete(a.id)}
            className="text-red-300 hover:text-red-200 text-sm underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
                              }
