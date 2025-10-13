import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [priceMap, setPriceMap] = useState({}); // ✅ เก็บราคาจริงของหุ้นทุกตัว
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  // ✅ Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ✅ โหลดข้อมูลจาก screener
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

      // ✅ ดึงราคาจาก Yahoo ของหุ้นทุกตัวใน 3 ตาราง
      const allSymbols = [
        ...shortData.map((d) => d.symbol),
        ...mediumData.map((d) => d.symbol),
        ...longData.map((d) => d.symbol),
      ];
      fetchPricesForAll(allSymbols);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // ✅ ดึงราคาจาก Yahoo ทีละตัว
  async function fetchYahooPrice(symbol) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) return;
      const price = meta.regularMarketPrice || meta.previousClose || 0;
      const changePercent = meta.regularMarketChangePercent || 0;

      setPriceMap((prev) => ({
        ...prev,
        [symbol]: { price, changePercent },
      }));
    } catch (err) {
      console.error("fetchYahooPrice error:", symbol, err);
    }
  }

  // ✅ ดึงราคาของหุ้นทั้งหมด
  async function fetchPricesForAll(symbols = []) {
    const unique = [...new Set(symbols.filter(Boolean))];
    unique.forEach((sym, i) => {
      setTimeout(() => fetchYahooPrice(sym), i * 250); // ✅ หน่วงเวลาเล็กน้อยป้องกัน rate-limit
    });
  }

  // ✅ โหลดครั้งแรก
  useEffect(() => {
    loadAll();
  }, []);

  // ✅ โหลด Favorites จาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // ✅ บันทึก Favorites ลง localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ สลับ Favorite
  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  // ✅ ล้าง Favorites
  const clearFavorites = () => {
    if (confirm("ต้องการล้างรายการโปรดทั้งหมดหรือไม่?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
    }
  };

  // ✅ ตารางหุ้น
  const renderTable = (title, color, data, isFav = false) => {
    if (!data?.length) return null;
    return (
      <div className="my-8 rounded-2xl border border-white/10 bg-[#101827]/80 p-5 shadow-lg hover:shadow-[0_0_15px_rgba(0,255,180,0.2)] transition">
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
                const isFav = favorites.includes(r.symbol);
                const p = priceMap[r.symbol];
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
                    <td className="p-3 font-semibold text-sky-400 hover:text-emerald-400">
                      {r.symbol}
                    </td>
                    <td
                      className={`p-3 font-mono ${
                        p
                          ? p.changePercent > 0
                            ? "text-green-400"
                            : p.changePercent < 0
                            ? "text-red-400"
                            : "text-gray-300"
                          : "text-gray-400"
                      }`}
                    >
                      {p ? `$${p.price.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 text-gray-400">
                      {p ? `${p.changePercent.toFixed(2)}%` : "-"}
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

  // ✅ รวมข้อมูล Favorites จริง
  const favoriteData = favorites.map((s) => ({ symbol: s }));

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
              onClick={loadAll}
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

      {/* Tables */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {error && <div className="text-center text-red-400 mb-4">{error}</div>}

        {renderTable("⭐ My Favorites — หุ้นที่คุณติดดาวไว้", "text-yellow-300", favoriteData, true)}
        {renderTable("⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด", "text-green-400", dataShort)}
        {renderTable("🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่", "text-yellow-400", dataMedium)}
        {renderTable("🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต", "text-sky-400", dataLong)}
      </div>
    </main>
  );
  }
