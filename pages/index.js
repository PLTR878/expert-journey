import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [symbolList, setSymbolList] = useState([]);
  const [favoriteData, setFavoriteData] = useState({}); // ✅ เก็บข้อมูลราคาหุ้นโปรดจริง
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
      } catch (err) {
        console.error(err);
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

  // ✅ โหลด Symbol จาก Yahoo ตามคำค้น
  async function loadSymbols(q = "") {
    try {
      if (!q.trim()) {
        setSymbolList([]);
        return;
      }
      const res = await fetch(`/api/symbols?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data.symbols)) setSymbolList(data.symbols);
    } catch (err) {
      console.error("loadSymbols error:", err);
    }
  }

  // ✅ โหลด Screener ครั้งแรก
  useEffect(() => {
    loadAll();
  }, []);

  // ✅ ค้นหา Symbol จาก Yahoo ทุกครั้งที่พิมพ์
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.trim()) loadSymbols(search);
      else setSymbolList([]);
    }, 600);
    return () => clearTimeout(delay);
  }, [search]);

  // ✅ โหลด Favorites จาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // ✅ บันทึก Favorites ลง localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ โหลดราคาจาก Yahoo (อัปเดตเข้ากลาง favoriteData)
  async function fetchYahooPrice(symbol) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
      );
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) return;

      const price = meta.regularMarketPrice || meta.previousClose || 0;
      const change = meta.regularMarketChangePercent || 0;

      setFavoriteData((prev) => ({
        ...prev,
        [symbol]: { symbol, price, change },
      }));
    } catch (err) {
      console.error("fetchYahooPrice error:", err);
    }
  }

  // ✅ โหลดราคาของ Favorites อัตโนมัติเมื่อเพิ่ม
  useEffect(() => {
    favorites.forEach((symbol) => fetchYahooPrice(symbol));
  }, [favorites]);

  // ✅ ดึงข้อมูล Screener ทั้งหมด + refresh ราคาหุ้นโปรด
  const handleRefresh = () => {
    loadAll();
    favorites.forEach((symbol) => fetchYahooPrice(symbol));
    if (search.trim()) loadSymbols(search);
  };

  // ✅ ล้าง Favorites
  const clearFavorites = () => {
    if (confirm("ต้องการล้างรายการโปรดทั้งหมดหรือไม่?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoriteData({});
    }
  };

  // ✅ สลับสถานะ Favorite
  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
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
        lastClose: null,
        rsi: null,
        signal: "-",
      }));

    return { short: match(dataShort), medium: match(dataMedium), long: match(dataLong), extra };
  };

  // ✅ ตารางหุ้น
  const renderTable = (title, color, data, isFav = false) => {
    if (!data.length) return null;

    return (
      <div className="my-8 rounded-2xl border border-white/10 bg-[#101827]/80 p-5 shadow-lg">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
          <h2 className={`text-lg sm:text-xl font-semibold ${color}`}>{title}</h2>
          {isFav && (
            <button
              onClick={clearFavorites}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm border-collapse text-center">
            <thead className="bg-white/5 text-gray-400 uppercase text-[12px] tracking-wide">
              <tr>
                <th className="p-3 text-left pl-5">⭐</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Price</th>
                <th className="p-3">Change%</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const isInFav = favorites.includes(r.symbol);
                const info = favoriteData[r.symbol];

                return (
                  <tr
                    key={r.symbol}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td
                      onClick={() => toggleFavorite(r.symbol)}
                      className="cursor-pointer text-[16px] text-yellow-400 pl-5"
                    >
                      {isInFav ? "★" : "☆"}
                    </td>
                    <td className="p-3 font-semibold text-sky-400 hover:text-emerald-400">
                      <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                    </td>
                    <td
                      className={`p-3 font-mono font-semibold ${
                        info
                          ? info.change > 0
                            ? "text-green-400"
                            : info.change < 0
                            ? "text-red-400"
                            : "text-gray-300"
                          : "text-gray-300"
                      }`}
                    >
                      {info ? `$${info.price.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 font-mono text-gray-400">
                      {info ? `${info.change.toFixed(2)}%` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ✅ ฟิลเตอร์ข้อมูลทั้งหมด
  const { short, medium, long, extra } = filterDataAll(
    dataShort,
    dataMedium,
    dataLong,
    search
  );
  const noResult =
    !short.length && !medium.length && !long.length && !extra.length && search.trim() !== "";

  // ✅ แสดงเฉพาะหุ้นใน Favorites
  const favRows = favorites.map((s) => ({ symbol: s }));

  return (
    <main className="min-h-screen bg-[#0b1220] text-white font-inter">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur-md border-b border-white/10 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between px-4 py-3 gap-3">
          <b className="text-[20px] sm:text-[22px] font-bold text-emerald-400">
            🌍 Visionary Stock Screener
          </b>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
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
            {favRows.length > 0 &&
              renderTable("⭐ My Favorites — หุ้นที่คุณติดดาวไว้", "text-yellow-300", favRows, true)}
            {renderTable("⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด", "text-green-400", short)}
            {renderTable("🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่", "text-yellow-400", medium)}
            {renderTable("🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต", "text-sky-400", long)}
            {renderTable("🧠 Yahoo Trending Results", "text-emerald-400", extra)}
          </>
        )}
      </div>
    </main>
  );
}
