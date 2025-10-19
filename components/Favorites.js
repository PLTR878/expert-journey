import { useState, useRef } from "react";

export default function Favorites({ data, favorites, setFavorites, fetchPrice }) {
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const logoMap = {
    NVDA: "nvidia.com",
    AAPL: "apple.com",
    TSLA: "tesla.com",
    MSFT: "microsoft.com",
    AMZN: "amazon.com",
    META: "meta.com",
    GOOG: "google.com",
    GOOGL: "google.com",
    INTC: "intel.com",
    AMD: "amd.com",
    PLTR: "palantir.com",
    BBAI: "bigbear.ai",
    LAES: "sectorspdr.com",
    RCAT: "redcatholdings.com",
    BTDR: "bitdeer.com",
    IREN: "irisenergy.co",
    SOFI: "sofi.com",
    RUN: "sunrun.com",
    ENPH: "enphase.com",
    F: "ford.com",
    GM: "gm.com",
  };

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
    <section className="w-full px-2 pt-3 bg-[#0b0f17] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-[18px] font-bold text-emerald-400 flex items-center gap-1">
          💙 My Favorite Stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 
                     border border-gray-700 rounded-md px-3 py-[5px] bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          🔍 Search
        </button>
      </div>

      {/* รายการหุ้น */}
      <div>
        {data?.length ? (
          data.map((r, i) => {
            const domain = logoMap[r.symbol] || `${r.symbol.toLowerCase()}.com`;
            const logoUrl = `https://logo.clearbit.com/${domain}`;
            return (
              <div
                key={r.symbol + i}
                className="flex items-center justify-between py-3 pl-2 pr-3 hover:bg-[#111827]/50 transition-all relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(r.symbol)}
              >
                {/* เส้นสีขาวบางสุดถึงชื่อหุ้น */}
                <div className="absolute left-0 top-[95%] h-[1px] w-[45%] bg-white/10"></div>

                {/* โลโก้ + ชื่อหุ้น */}
                <div className="flex items-center gap-3 min-w-[40%]">
                  <div className="relative w-9 h-9">
                    <img
                      src={logoUrl}
                      alt={r.symbol}
                      onError={(e) => (e.target.src = "/default-logo.png")}
                      className="w-9 h-9 rounded-full object-cover shadow-sm"
                    />
                  </div>
                  <a
                    href={`/analyze/${r.symbol}`}
                    className="text-sky-400 font-extrabold text-[17px] tracking-tight hover:text-emerald-400 transition-colors"
                  >
                    {r.symbol}
                  </a>
                </div>

                {/* ราคา */}
                <div className="w-[23%] text-right font-bold text-[16px] text-gray-100 font-mono">
                  {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                </div>

                {/* RSI */}
                <div
                  className={`w-[18%] text-right font-bold text-[16px] font-mono ${
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
                </div>

                {/* AI Signal */}
                <div
                  className={`w-[19%] text-right font-extrabold text-[16px] ${
                    r.signal === "Buy"
                      ? "text-green-400"
                      : r.signal === "Sell"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {r.signal || "-"}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 italic py-6">
            No favorites yet. Add one by searching 🔍
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111827] rounded-2xl shadow-xl p-5 w-[80%] max-w-xs text-center border border-gray-700 -translate-y-14">
            <h3 className="text-lg text-emerald-400 font-bold mb-3">Search Stock</h3>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-emerald-400 text-[15px]">🔎</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="พิมพ์ชื่อย่อหุ้น เช่น NVDA, TSLA"
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
