import { useState, useRef, useEffect } from "react";

export default function Favorites({ favorites, setFavorites }) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ ดึงข้อมูลจาก Visionary Eternal (daily + logo)
  const fetchStockData = async (sym) => {
    try {
      // ดึงข้อมูลราคา
      const res = await fetch(`/api/visionary-eternal?type=daily&symbol=${sym}`);
      const json = await res.json();

      // ดึงโลโก้จาก API ใหม่
      const logoRes = await fetch(`/api/visionary-eternal?type=logo&symbol=${sym}`);
      const logoJson = await logoRes.json();

      if (json && !json.error) {
        let signal = "Hold";
        if (json.trend === "Uptrend") signal = "Buy";
        else if (json.trend === "Downtrend") signal = "Sell";

        const companyName =
          json.companyName ||
          sym.toUpperCase() ||
          "";

        const item = {
          ...json,
          signal,
          logo: logoJson.logo,
          companyName,
        };

        setData((prev) => {
          const existing = prev.find((x) => x.symbol === sym);
          if (existing) {
            return prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x));
          } else {
            return [...prev, item];
          }
        });
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  // ✅ โหลดข้อมูลทั้งหมดจากรายการโปรด
  useEffect(() => {
    if (favorites?.length) favorites.forEach((sym) => fetchStockData(sym));
  }, [favorites]);

  // ✅ เพิ่มหุ้นใหม่
  const handleSubmit = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if (!favorites.includes(sym)) {
      const updated = [...favorites, sym];
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      await fetchStockData(sym);
    }
    setSymbol("");
    setShowModal(false);
  };

  // ✅ ลบหุ้น (ปัดซ้าย)
  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (sym) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 70) removeFavorite(sym);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // ✅ UI
  return (
    <section className="w-full px-2 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          🔮 My Favorite Stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 
                     border border-gray-700 rounded-md px-3 py-[4px] bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          ➕ Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-1">
        <table className="w-full text-[15px] text-center border-separate border-spacing-0">
          <tbody>
            {favorites?.length ? (
              favorites.map((sym, i) => {
                const r = data.find((x) => x.symbol === sym);
                const logo = r?.logo || "https://cdn-icons-png.flaticon.com/512/2301/2301122.png";
                const company = r?.companyName || sym;

                return (
                  <tr
                    key={sym + i}
                    className="transition-all hover:bg-[#111827]/40 border-b border-gray-800/40"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleTouchEnd(sym)}
                  >
                    {/* โลโก้ + ชื่อหุ้น + ชื่อบริษัท */}
                    <td className="relative py-[13px] pl-[48px] text-left align-middle">
                      <div className="absolute left-[4px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full overflow-hidden">
                        <img
                          src={logo}
                          alt={sym}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/2301/2301122.png";
                          }}
                          className="w-9 h-9 object-contain"
                        />
                      </div>
                      <div className="flex flex-col leading-tight max-w-[120px]">
                        <a
                          href={`/analyze/${sym}`}
                          className="text-white hover:text-emerald-400 font-semibold tracking-tight text-[15px] truncate"
                        >
                          {sym}
                        </a>
                        <span className="text-[11px] text-gray-400 font-medium truncate">
                          {company}
                        </span>
                      </div>
                    </td>

                    {/* ราคา */}
                    <td className="py-[12px] px-3 text-right font-semibold text-gray-100 font-mono text-[15px] whitespace-nowrap">
                      {r?.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                    </td>

                    {/* RSI */}
                    <td
                      className={`py-[12px] px-3 text-right font-semibold font-mono text-[15px] ${
                        typeof r?.rsi === "number"
                          ? r.rsi > 70
                            ? "text-red-400"
                            : r.rsi < 40
                            ? "text-blue-400"
                            : "text-emerald-400"
                          : "text-gray-400"
                      }`}
                    >
                      {typeof r?.rsi === "number" ? Math.round(r.rsi) : "-"}
                    </td>

                    {/* สัญญาณ AI */}
                    <td
                      className={`py-[12px] px-3 text-right font-semibold text-[15px] whitespace-nowrap ${
                        r?.signal === "Buy"
                          ? "text-green-400"
                          : r?.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r?.signal || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-gray-500 text-center italic">
                  No favorites yet. Add one by searching ➕
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111827] rounded-2xl shadow-xl p-5 w-[80%] max-w-xs text-center border border-gray-700 -translate-y-14">
            <h3 className="text-lg text-emerald-400 font-bold mb-3">Search Stock</h3>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-emerald-400 text-[15px]">➕</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="พิมพ์ชื่อย่อหุ้น เช่น NVDA,TSLA"
                className="w-full pl-9 pr-3 text-center bg-[#0d121d]/90 border border-gray-700 text-gray-100 rounded-md py-[9px]
                           focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-4 text-[14px] font-semibold"
              />
            </div>
            <div className="flex justify-around">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-md text-gray-400 hover:text-gray-200 border border-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
          }
