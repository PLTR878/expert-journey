import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [symbolList, setSymbolList] = useState([]); // ✅ เพิ่มไว้เก็บ symbols ทั้งหมด
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // โหลดข้อมูลหลัก (screener)
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

  // ✅ โหลด symbol list จาก Yahoo API
  async function loadSymbols() {
    try {
      const res = await fetch("/api/symbols");
      const data = await res.json();
      if (Array.isArray(data.symbols)) setSymbolList(data.symbols);
    } catch (err) {
      console.error("loadSymbols error:", err);
    }
  }

  useEffect(() => {
    loadAll();
    loadSymbols(); // ✅ โหลด symbols ตอนเปิดเว็บ
  }, []);

  // ✅ รวมข้อมูลทั้งหมดไว้ค้นหา
  const allSymbols = [
    ...dataShort,
    ...dataMedium,
    ...dataLong,
    ...symbolList.map((s) => ({
      symbol: s.symbol,
      lastClose: null,
      rsi: null,
      signal: "-",
    })),
  ];

  // ✅ ฟังก์ชันค้นหาครอบคลุมทุก dataset
  const filterDataAll = (all, search) => {
    if (!search.trim()) return all;
    const q = search.trim().toLowerCase();
    return all.filter((d) => (d.symbol || "").toLowerCase().includes(q));
  };

  const filtered = filterDataAll(allSymbols, search);

  // Favorite toggle
  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  // ✅ UI แสดงผล
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
              onClick={() => {
                loadAll();
                loadSymbols();
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
          placeholder="🔍 Search Symbol (เช่น NVDA, AAPL, TSLA...)"
          className="w-full sm:w-1/2 px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 focus:border-emerald-400/40 outline-none transition text-gray-200 placeholder-gray-500 text-center"
        />
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {error && <div className="text-center text-red-400 mb-4">{error}</div>}

        {filtered.length === 0 && search.trim() !== "" ? (
          <div className="text-center text-yellow-400 mt-8 text-sm">
            ⚠️ ไม่พบหุ้นที่ตรงกับคำค้น "<b>{search}</b>"
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#101827]/80 p-5 shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-emerald-400 border-b border-white/10 pb-2">
              🔍 ผลการค้นหา
            </h2>
            <div className="overflow-x-auto">
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
                  {filtered.map((r) => {
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
                        <td className="p-3 font-mono text-gray-300">
                          {r.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                        </td>
                        <td className="p-3 text-gray-400">
                          {r.rsi ? r.rsi.toFixed(1) : "-"}
                        </td>
                        <td className="p-3 text-gray-400">{r.signal || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
                }
