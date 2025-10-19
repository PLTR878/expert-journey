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
    <section className="w-full bg-black text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <h2 className="text-[17px] font-semibold text-white flex items-center gap-1">
          รายการหุ้น
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 
                     border border-gray-700 rounded-md px-3 py-[4px] bg-[#111]/90 hover:bg-[#1c1c1c]"
        >
          ➕ เพิ่มรายการ
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-800">
        {data?.length ? (
          data.map((r, i) => {
            const domain = logoMap[r.symbol] || `${r.symbol.toLowerCase()}.com`;
            const logoUrl = `https://logo.clearbit.com/${domain}`;
            const color =
              r.changePercent > 0
                ? "text-emerald-400"
                : r.changePercent < 0
                ? "text-red-400"
                : "text-gray-400";

            return (
              <div
                key={r.symbol + i}
                className="flex justify-between items-center px-4 py-2.5 hover:bg-[#111]/80 transition-all"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(r.symbol)}
              >
                {/* Left: Logo + Symbol + Name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1e293b]/70">
                    <img
                      src={logoUrl}
                      alt={r.symbol}
                      onError={(e) => (e.target.src = "/default-logo.png")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-white font-semibold text-[15px] tracking-tight">
                      {r.symbol}
                    </span>
                    <span className="text-gray-400 text-[12px]">
                      {r.name || "Stock Inc."}
                    </span>
                  </div>
                </div>

                {/* Right: Price + % Change */}
                <div className="text-right">
                  <div className="text-white font-semibold text-[15px] font-mono">
                    {r.price ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </div>
                  <div className={`text-[13px] font-mono ${color}`}>
                    {r.changePercent != null
                      ? `${r.changePercent > 0 ? "+" : ""}${r.changePercent.toFixed(
                          2
                        )}%`
                      : ""}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">ยังไม่มีหุ้นในรายการ</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111827] rounded-2xl shadow-xl p-5 w-[80%] max-w-xs text-center border border-gray-700 -translate-y-14">
            <h3 className="text-lg text-emerald-400 font-bold mb-3">เพิ่มหุ้น</h3>
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
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold text-sm"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
        }
