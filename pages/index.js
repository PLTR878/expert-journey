import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Load data
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

  useEffect(() => {
    loadAll();
  }, []);

  // ✅ ฟังก์ชันค้นหาใหม่ (ไม่สนตัวพิมพ์เล็กใหญ่ และรวมทุกกลุ่ม)
  const filterDataAll = (dataShort, dataMedium, dataLong, search) => {
    if (!search.trim()) {
      return { short: dataShort, medium: dataMedium, long: dataLong };
    }

    const q = search.trim().toLowerCase();
    const match = (arr) =>
      arr.filter((d) => (d.symbol || "").toLowerCase().includes(q));

    return {
      short: match(dataShort),
      medium: match(dataMedium),
      long: match(dataLong),
    };
  };

  // Favorite toggle
  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Table
  const renderTable = (title, color, data) => {
    if (data.length === 0) return null;

    return (
      <div className="my-8 rounded-2xl border border-white/10 bg-[#101827]/80 p-5 shadow-lg hover:shadow-[0_0_15px_rgba(0,255,180,0.2)] transition">
        <h2
          className={`text-lg sm:text-xl font-semibold mb-4 border-b border-white/10 pb-2 ${color}`}
        >
          {title}
        </h2>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm border-collapse text-center">
            <thead className="bg-white/5 text-gray-400 uppercase text-[12px] tracking-wide">
              <tr>
                <th className="p-3 text-left pl-5">⭐</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Price</th>
                <th className="p-3">RSI</th>
                <th className="p-3">AI Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const isFav = favorites.includes(r.symbol);
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
                      <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                    </td>
                    <td
                      className={`p-3 font-mono font-semibold ${
                        r.changePercent > 0
                          ? "text-green-400"
                          : r.changePercent < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      ${r.lastClose?.toFixed?.(2) ?? "-"}
                      <div className="text-xs">
                        {r.changePercent
                          ? `${r.changePercent.toFixed(2)}%`
                          : ""}
                      </div>
                    </td>
                    <td
                      className={`p-3 font-mono font-semibold ${
                        r.rsi > 70
                          ? "text-red-400"
                          : r.rsi > 60
                          ? "text-green-400"
                          : r.rsi < 40
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }`}
                    >
                      {r.rsi?.toFixed?.(1) ?? "-"}
                    </td>
                    <td className="p-3 font-bold">
                      <span
                        className={
                          r.signal === "Buy"
                            ? "text-green-400"
                            : r.signal === "Sell"
                            ? "text-red-400"
                            : "text-yellow-300"
                        }
                      >
                        {r.signal || "-"}
                      </span>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {r.conf ? (r.conf * 100).toFixed(0) + "%" : "-"}
                      </div>
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

  // ✅ เรียกใช้ฟังก์ชันค้นหาใหม่
  const { short, medium, long } = filterDataAll(
    dataShort,
    dataMedium,
    dataLong,
    search
  );

  // ✅ เช็กว่าค้นหาแล้วไม่มีหุ้นตรงกันเลย
  const noResult =
    !short.length && !medium.length && !long.length && search.trim() !== "";

  // UI
  return (
    <main className="min-h-screen bg-[#0b1220] text-white font-inter">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur-md border-b border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
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

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search Symbol (เช่น NVDA, AAPL, TSLA...)"
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
            {renderTable("⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด", "text-green-400", short)}
            {renderTable("🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่", "text-yellow-400", medium)}
            {renderTable("🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต", "text-sky-400", long)}
          </>
        )}
      </div>
    </main>
  );
                      }
