import { useState, useRef } from "react";

export default function Favorites({ data, favorites, setFavorites, fetchPrice }) {
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

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

  return (
    <section className="w-full px-3 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-2">
        <h2 className="text-[17px] font-bold text-emerald-400 tracking-tight">
          💙 My Favorite Stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 
                     border border-gray-700 rounded-md px-3 py-1.5 bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          🔍 Search
        </button>
      </div>

      {/* 📊 ตาราง */}
      <div className="overflow-x-auto -mt-1">
        <table className="w-full text-[15px] text-center border-collapse">
          <thead className="text-[#9ca3af] text-[12px] uppercase select-none font-semibold">
            <tr className="border-b border-white/5">
              <th className="py-2 text-left pl-2 w-[34%] tracking-tight">TICKER</th>
              <th className="py-2 text-right pr-4 w-[21%] tracking-tight">$</th>
              <th className="py-2 text-right pr-3 w-[22%] tracking-tight">RSI</th>
              <th className="py-2 text-right pr-3 w-[23%] tracking-tight">AI</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="hover:bg-[#151821]/60 transition-all border-b border-white/5"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(r.symbol)}
                >
                  <td className="py-3 text-left pl-2 font-bold text-sky-400 tracking-tight">
                    <a href={`/analyze/${r.symbol}`} className="hover:text-emerald-400 transition-colors">
                      {r.symbol}
                    </a>
                  </td>
                  <td className="py-3 text-right pr-4 font-bold text-gray-100 font-mono tracking-tight">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>
                  <td
                    className={`py-3 text-right pr-3 font-bold font-mono tracking-tight ${
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
                    className={`py-3 text-right pr-3 font-bold tracking-tight ${
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

      {/* 🔍 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111827] rounded-2xl shadow-xl p-5 w-[80%] max-w-xs text-center border border-gray-700 -translate-y-16">
            <h3 className="text-lg text-emerald-400 font-bold mb-4 tracking-tight">
              Search Stock
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-emerald-400">🔎</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="พิมพ์ชื่อย่อหุ้น เช่น NVDA, TSLA"
                className="w-full pl-9 pr-3 text-center bg-[#0d121d]/90 border border-gray-700 text-gray-100 rounded-md py-2 
                           focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-4 text-[14px] tracking-tight font-bold"
              />
            </div>
            <div className="flex justify-around">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-md text-gray-400 hover:text-gray-200 border border-gray-700 text-sm tracking-tight"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold text-sm tracking-tight"
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
