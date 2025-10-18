import { useState, useRef, useEffect } from "react";

export default function Favorites({ data }) {
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [favorites, setFavorites] = useState([]);

  // ✅ โหลด favorites เฉพาะฝั่ง client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("favorites");
      if (stored) setFavorites(JSON.parse(stored));
    }
  }, []);

  const saveFavorites = (arr) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favorites", JSON.stringify(arr));
      setFavorites(arr);
    }
  };

  // === Add stock ===
  const handleSearch = () => setShowModal(true);
  const handleSubmit = () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if (!favorites.includes(sym)) {
      const updated = [...favorites, sym];
      saveFavorites(updated);
    }
    setSymbol("");
    setShowModal(false);
  };

  // === Remove stock ===
  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    saveFavorites(updated);
  };

  // === Swipe gesture ===
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
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
    <section className="w-full px-2 pt-1">
      <div className="flex justify-between items-center mb-2 border-b border-[rgba(255,255,255,0.05)] pb-2">
        <h2 className="text-[17px] font-semibold text-emerald-400 flex items-center gap-2">
          💙 My Favorite Stocks
        </h2>
        <button
          onClick={handleSearch}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 border border-gray-700 rounded-md px-3 py-1 shadow-sm bg-[#0f172a]/60"
        >
          🔍 Search
        </button>
      </div>

      {/* 📊 ตารางหุ้น */}
      <div className="overflow-x-auto -mt-1">
        <table className="w-full text-[15px] text-center border-collapse">
          <thead>
            <tr
              className="text-[#9ca3af] text-[12px] uppercase select-none"
              style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
            >
              <th className="py-2 font-medium text-left pl-3 w-[30%]">SYMBOL</th>
              <th className="py-2 font-medium text-right pr-2 w-[23%]">PRICE</th>
              <th className="py-2 font-medium text-right pr-2 w-[22%]">RSI</th>
              <th className="py-2 font-medium text-right pr-2 w-[25%]">AI SIG</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="transition-all hover:bg-[#151821]/60 relative"
                  style={{
                    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(r.symbol)}
                >
                  <td className="py-3 text-left pl-3 font-semibold text-sky-400">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>
                  <td className="py-3 text-right pr-2 font-mono text-gray-100">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>
                  <td
                    className={`py-3 text-right pr-2 font-mono ${
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
                    className={`py-3 text-right pr-2 font-semibold ${
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
                <td
                  colSpan="4"
                  className="py-4 text-gray-500 text-center italic"
                >
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
          <div className="bg-[#111827] rounded-2xl shadow-xl p-6 w-[85%] max-w-sm text-center border border-gray-700">
            <h3 className="text-lg text-emerald-400 font-semibold mb-4">
              Search Stock
            </h3>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter stock symbol (e.g. NVDA, TSLA)"
              className="w-full text-center bg-[#0d121d] border border-gray-700 text-gray-200 rounded-md py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-5"
            />
            <div className="flex justify-around">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md text-gray-400 hover:text-gray-200 border border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white font-semibold"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
              }
