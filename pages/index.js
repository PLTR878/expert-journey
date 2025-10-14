import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [symbolList, setSymbolList] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  // ✅ Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ✅ โหลดข้อมูล Screener
  async function loadAll() {
    setLoading(true);
    setError("");
    async function fetchData(horizon) {
      try {
        const res = await fetch("/api/screener", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizon }),
        });
        const j = await res.json();
        return j?.results || [];
      } catch {
        return [];
      }
    }
    try {
      const [shortData, mediumData, longData] = await Promise.all([
        fetchData("short"),
        fetchData("medium"),
        fetchData("long"),
      ]);
      setDataShort(shortData);
      setDataMedium(mediumData);
      setDataLong(longData);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // ✅ ดึงราคาผ่าน API ของเราเอง + RSI + AI Signal
  async function fetchYahooPrice(symbol, forceUpdate = false) {
    try {
      const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return;
      const data = await res.json();
      const price = Number(data.price) || 0;
      const changePercent =
        typeof data.changePercent === "number" ? data.changePercent : 0;
      const rsi = data.rsi ?? null;
      const signal = data.signal ?? "-";

      setFavoritePrices((prev) => ({
        ...prev,
        [symbol]: { price, changePercent, rsi, signal },
      }));

      if (forceUpdate) setTimeout(() => setFavorites((prev) => [...prev]), 150);
    } catch {}
  }

  // ✅ โหลด Symbol จาก Yahoo
  async function loadSymbols(q = "") {
    try {
      if (!q.trim()) {
        setSymbolList([]);
        return;
      }
      const res = await fetch(`/api/symbols?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data.symbols)) {
        setSymbolList(data.symbols);
        data.symbols.forEach((s) => fetchYahooPrice(s.symbol));
      }
    } catch {}
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ✅ Search Realtime + Scroll ขึ้นบน
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.trim()) {
        loadSymbols(search);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSymbolList([]);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [search]);

  // ✅ โหลด / บันทึก Favorites
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ เพิ่ม/ลบ Favorites
  const toggleFavorite = (symbol) => {
    setFavorites((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        fetchYahooPrice(symbol, true);
        return [...prev, symbol];
      }
    });
  };

  // ✅ โหลดราคาทุกครั้งเมื่อเปิดหน้า
  useEffect(() => {
    favorites.forEach((symbol) => fetchYahooPrice(symbol));
  }, [favorites]);

  // ✅ Auto Refresh 60 วิ
  useEffect(() => {
    const interval = setInterval(() => {
      if (favorites.length > 0) favorites.forEach((s) => fetchYahooPrice(s));
    }, 60000);
    return () => clearInterval(interval);
  }, [favorites]);

  // ✅ ล้าง Favorites
  const clearFavorites = () => {
    if (confirm("ต้องการล้างรายการโปรดทั้งหมดหรือไม่?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoritePrices({});
    }
  };

  // ✅ รวมผลลัพธ์ทั้งหมด
  const filterDataAll = (dataShort, dataMedium, dataLong, search) => {
    if (!search.trim())
      return { short: dataShort, medium: dataMedium, long: dataLong, extra: [] };

    const q = search.trim().toLowerCase();
    const match = (arr) =>
      arr.filter((d) => (d.symbol || "").toLowerCase().includes(q));

    const extra = symbolList
      .filter((s) => (s.symbol || "").toLowerCase().includes(q))
      .slice(0, 10)
      .map((s) => ({
        symbol: s.symbol,
        name: s.name || "",
        lastClose: favoritePrices[s.symbol]?.price || null,
        rsi: favoritePrices[s.symbol]?.rsi ?? "-",
        signal: favoritePrices[s.symbol]?.signal ?? "-",
      }));

    return {
      short: match(dataShort),
      medium: match(dataMedium),
      long: match(dataLong),
      extra,
    };
  };

  // ✅ ตารางหุ้น (ไม่มีกรอบ + ใช้พื้นที่เต็ม)
  const renderTable = (title, color, data) => {
    if (!data.length) return null;
    return (
      <div className="my-4 p-0 bg-transparent">
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-white/10">
          <h2 className={`text-lg sm:text-xl font-semibold ${color}`}>{title}</h2>
          {title.includes("Favorites") && (
            <button
              onClick={clearFavorites}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-center">
            <thead className="bg-white/5 text-gray-400 uppercase text-[12px] tracking-wide">
              <tr>
                <th className="p-2 text-left pl-5">⭐</th>
                <th className="p-2">Symbol</th>
                <th className="p-2">Price</th>
                <th className="p-2">RSI</th>
                <th className="p-2">AI Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const isFav = favorites.includes(r.symbol);
                const p = favoritePrices[r.symbol];
                const priceText = p?.price
                  ? `$${p.price.toFixed(2)}`
                  : r.lastClose
                  ? `$${r.lastClose.toFixed(2)}`
                  : "-";
                const signal = p?.signal || r.signal || "-";
                const signalColor =
                  signal === "Buy"
                    ? "text-green-400"
                    : signal === "Sell"
                    ? "text-red-400"
                    : "text-yellow-400";

                return (
                  <tr
                    key={r.symbol}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td
                      onClick={() => toggleFavorite(r.symbol)}
                      className="cursor-pointer text-[16px] text-yellow-400 pl-5"
                    >
                      {isFav ? "★" : "☆"}
                    </td>
                    <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                      <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                    </td>
                    <td className="p-2 font-mono font-semibold text-gray-300">
                      {priceText}
                    </td>
                    <td className="p-2 text-gray-400">
                      {p?.rsi ? p.rsi.toFixed(1) : r.rsi ?? "-"}
                    </td>
                    <td className={`p-2 font-semibold ${signalColor}`}>{signal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ✅ รวมข้อมูลทุกตาราง
  const { short, medium, long, extra } = filterDataAll(
    dataShort,
    dataMedium,
    dataLong,
    search
  );
  const noResult =
    !short.length && !medium.length && !long.length && !extra.length && search.trim() !== "";

  const favoriteData = favorites
    .map((symbol) => ({
      symbol,
      ...favoritePrices[symbol],
    }))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white font-inter">
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur-md border-b border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between px-4 py-3 gap-3">
          <b className="text-[20px] sm:text-[22px] font-bold text-emerald-400">
            🌍 Visionary Stock Screener
          </b>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadAll();
                favorites.forEach((s) => fetchYahooPrice(s));
                if (search.trim()) loadSymbols(search);
              }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 font-semibold transition"
            >
              {loading ? "Loading..." : "🔁 Refresh"}
            </button>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#141b2d] border border-white/10 text-white text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search Symbol (เช่น NVDA, AAPL, AEHR, BBAI...)"
          className="w-full sm:w-1/2 px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 focus:border-emerald-400/40 outline-none transition text-gray-200 placeholder-gray-500 text-center"
        />
      </div>

      {/* Tables */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {error && <div className="text-center text-red-400 mb-4">{error}</div>}
        {noResult ? (
          <div className="text-center text-yellow-400 mt-8 text-sm">
            ⚠️ ไม่พบหุ้นที่ตรงกับคำค้น "<b>{search}</b>"
          </div>
        ) : (
          <>
            {search.trim() && extra.length > 0 &&
              renderTable("🧠 Yahoo Search Results — ผลค้นหาจาก Yahoo", "text-emerald-400", extra)}

            {favoriteData.length > 0 &&
              renderTable("⭐ My Favorites — หุ้นที่คุณติดดาวไว้", "text-yellow-300", favoriteData)}

            {renderTable("⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด", "text-green-400", dataShort)}
            {renderTable("🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่", "text-yellow-400", dataMedium)}
            {renderTable("🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต", "text-sky-400", dataLong)}
          </>
        )}
      </div>
    </main>
  );
                  }
