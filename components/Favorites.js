import { useState, useRef } from "react";

export default function Favorites({ data, favorites, setFavorites, fetchPrice }) {
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ เพิ่มหุ้น
  const handleSubmit = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if (!favorites.includes(sym)) {
      const updated = [...favorites, sym];
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      await fetchPrice(sym);
    }
    setSymbol("");
    setShowModal(false);
  };

  // ✅ ลบหุ้น
  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  // ✅ ปัดซ้ายเพื่อลบ
  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (sym) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 70) removeFavorite(sym);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="w-full px-3 pt-2">
      {/* 🩵 Header */}
      <div className="flex justify-between items-center mb-3 border-b border-[rgba(255,255,255,0.05)] pb-2">
        <h2 className="text-[17px] font-semibold text-emerald-400 flex items-center gap-2 tracking-wide">
          💙 My Favorite Stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 border border-gray-700 rounded-md px-3 py-1.5 shadow-sm bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          🔍 Search
        </button>
      </div>

      {/* 📊 ตาราง */}
      <div className="overflow-x-auto -mt-1 rounded-lg border border-white/5 shadow-inner">
        <table className="w-full text-[15px] text-center border-collapse">
          <thead className="bg-[#0d1525]/70 backdrop-blur-sm">
            <tr
              className="text-[#a1a1aa] text-[12px] uppercase select-none"
              style={{ borderBottom: "0.3px solid rgba(255,255,255,0.05)" }}
            >
              <th className="py-2 font-medium text-left pl-2 w-[34%]">SYMBOL</th>
              <th className="py-2 font-medium text-right pr-4 w-[21%]">PRICE</th>
              <th className="py-2 font-medium text-right pr-3 w-[22%]">RSI</th>
              <th className="py-2 font-medium text-right pr-3 w-[23%]">AI SIG</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="transition-all hover:bg-[#151821]/70 hover:shadow-[0_0_6px_rgba(16,185,129,0.25)]"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(r.symbol)}
                  style={{ borderBottom: "0.3px solid rgba(255,255,255,0.05)" }}
                >
                  <td className="py-3 text-left pl-2 font-semibold text-sky-400">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-all drop-shadow-[0_0_3px_rgba(16,185,129,0.4)]"
                    >
                      {r.symbol}
                    </a>
                  </td>
                  <td className="py-3 text-right pr-4 font-mono text-gray-100">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>
                  <td
                    className={`py-3 text-right pr-3 font-mono ${
                      typeof r.rsi === "number"
                        ? r.rsi > 70
                          ? "text-red-400"
                          : r.rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {typeof r.rsi === "number" ? Math.round(r.rsi) : "-"}
                  </td>
                  <td
                    className={`py-3 text-right pr-3 font-semibold ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-gray-500 text-center italic">
                  No favorites yet. Add one by searching 🔍
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✨ เส้น Gradient */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent mt-3 mb-5"></div>

      {/* 🔍 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          {/* 💎 กล่องค้นหาแบบ Glow */}
          <div className="bg-[#111827]/95 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.25)] 
                          p-5 w-[80%] max-w-xs text-center border border-emerald-400/30 -translate-y-16">
            <h3 className="text-lg text-emerald-400 font-semibold mb-4 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]">
              Search Stock
            </h3>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-emerald-400">🔎</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="พิมพ์ชื่อย่อหุ้น เช่น NVDA, TSLA"
                className="w-full pl-9 pr-3 text-center bg-[#0d121d]/90 border border-emerald-400/40 
                           text-gray-100 rounded-lg py-2 text-[14px] placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-emerald-400/70 
                           focus:shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all mb-4"
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
                className="px-4 py-1.5 rounded-md bg-emerald-500/80 hover:bg-emerald-500 
                           text-white font-semibold text-sm shadow-md shadow-emerald-500/20"
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
