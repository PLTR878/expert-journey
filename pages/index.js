import { useEffect, useState } from "react";

export default function Home() {
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [search, setSearch] = useState("");
  const [symbolList, setSymbolList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // โหลดรายการโปรดจาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // โหลดข้อมูล Screener
  async function loadAll() {
    setLoading(true);
    try {
      const fetcher = async (horizon) =>
        fetch("/api/screener", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizon }),
        })
          .then((r) => r.json())
          .then((j) => j.results || []);
      const [short, medium, long] = await Promise.all([
        fetcher("short"),
        fetcher("medium"),
        fetcher("long"),
      ]);
      setDataShort(short);
      setDataMedium(medium);
      setDataLong(long);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ดึงราคา RSI Signal จาก /api/price
  async function fetchYahooPrice(symbol) {
    try {
      const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
      if (!r.ok) return;
      const j = await r.json();
      setFavoritePrices((prev) => ({
        ...prev,
        [symbol]: {
          price: Number(j.price) || 0,
          rsi: j.rsi ?? "-",
          signal: j.signal ?? "-",
        },
      }));
    } catch {}
  }

  useEffect(() => {
    favorites.forEach(fetchYahooPrice);
  }, [favorites]);

  // Auto Refresh ทุก 60 วิ
  useEffect(() => {
    const i = setInterval(() => favorites.forEach(fetchYahooPrice), 60000);
    return () => clearInterval(i);
  }, [favorites]);

  // Toggle Favorite
  const toggleFavorite = (sym) => {
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // ล้าง Favorites
  const clearFavorites = () => {
    if (confirm("ต้องการล้างรายการโปรดทั้งหมดหรือไม่?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoritePrices({});
    }
  };

  // ค้นหา Symbol
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) {
        setSymbolList([]);
        return;
      }
      const res = await fetch(`/api/symbols?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .catch(() => ({ symbols: [] }));
      setSymbolList(res.symbols || []);
    }, 600);
    return () => clearTimeout(t);
  }, [search]);

  // ตารางหุ้น
  const renderTable = (title, color, data, limit = 999) => {
    const sliced = data.slice(0, limit);
    if (!sliced.length) return null;
    return (
      <div className="my-5 bg-[#101827]/70 rounded-2xl shadow-md p-3 sm:p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
          {title.includes("Favorites") && (
            <button
              onClick={clearFavorites}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>
        <table className="w-full text-sm text-center border-collapse">
          <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
            <tr>
              <th className="p-2 text-left pl-4">⭐</th>
              <th className="p-2">Symbol</th>
              <th className="p-2">Price</th>
              <th className="p-2">RSI</th>
              <th className="p-2">AI</th>
            </tr>
          </thead>
          <tbody>
            {sliced.map((r) => {
              const isFav = favorites.includes(r.symbol);
              const f = favoritePrices[r.symbol];
              const priceText = f?.price
                ? `$${f.price.toFixed(2)}`
                : r.lastClose
                ? `$${r.lastClose.toFixed(2)}`
                : "-";
              const rsi = f?.rsi ?? r.rsi ?? "-";
              const sig = f?.signal ?? r.signal ?? "-";
              const sigColor =
                sig === "Buy"
                  ? "text-green-400"
                  : sig === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400";
              return (
                <tr
                  key={r.symbol}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td
                    onClick={() => toggleFavorite(r.symbol)}
                    className="cursor-pointer text-yellow-400 text-[16px] pl-4"
                  >
                    {isFav ? "★" : "☆"}
                  </td>
                  <td className="p-2 font-semibold text-sky-400 hover:text-emerald-400">
                    <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                  </td>
                  <td className="p-2 font-mono">{priceText}</td>
                  <td className="p-2 text-gray-300">{rsi}</td>
                  <td className={`p-2 font-semibold ${sigColor}`}>{sig}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // รวม favorites + screener
  const favoriteData = favorites.map((s) => ({
    symbol: s,
    ...favoritePrices[s],
  }));

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <b className="text-emerald-400 text-lg sm:text-xl">
            🌍 Visionary Stock Screener
          </b>
          <button
            onClick={loadAll}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 text-sm font-semibold"
          >
            {loading ? "Loading..." : "🔁 Refresh"}
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search Symbol (เช่น NVDA, AAPL, IREN, BTDR...)"
          className="w-full sm:w-1/2 px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 outline-none text-center text-gray-200 placeholder-gray-500"
        />
      </div>

      {/* รายการโปรดเป็นหน้าแรก */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {favoriteData.length > 0 ? (
          renderTable("⭐ My Favorites — หุ้นที่คุณติดดาวไว้", "text-yellow-300", favoriteData)
        ) : (
          <div className="text-center text-gray-400 mt-6">
            ⭐ ยังไม่มีรายการโปรด — แตะ “☆” ที่หุ้นใดก็ได้เพื่อเพิ่มเข้ารายการนี้
          </div>
        )}

        {/* Widget ย่อของหมวดอื่น */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          {renderTable("⚡ Fast Movers", "text-green-400", dataShort, 4)}
          {renderTable("🌱 Emerging Trends", "text-yellow-400", dataMedium, 4)}
          {renderTable("🚀 Future Leaders", "text-sky-400", dataLong, 4)}
        </div>

        {/* ผลค้นหาจาก Yahoo */}
        {search.trim() && symbolList.length > 0 && (
          renderTable("🧠 Search Results", "text-emerald-400", symbolList.map(s => ({symbol: s.symbol, lastClose: 0})), 5)
        )}
      </div>
    </main>
  );
}
