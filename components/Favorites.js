import { useState, useRef, useEffect } from "react";

export default function Favorites({ favorites, setFavorites }) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โลโก้หลัก
  const logoMap = {
    NVDA: "nvidia.com",
    AAPL: "apple.com",
    TSLA: "tesla.com",
    MSFT: "microsoft.com",
    AMZN: "amazon.com",
    META: "meta.com",
    GOOG: "google.com",
    AMD: "amd.com",
    INTC: "intel.com",
    PLTR: "palantir.com",
    IREN: "irisenergy.co",
    RXRX: "recursion.com",
    RR: "rolls-royce.com",
    AEHR: "aehr.com",
    SLDP: "solidpowerbattery.com",
    NRGV: "energyvault.com",
    BBAI: "bigbear.ai",
    NVO: "novonordisk.com",
    GWH: "esstech.com",
    COST: "costco.com",
    QUBT: "quantumcomputinginc.com",
    UNH: "uhc.com",
    EZGO: "ezgoev.com",
    QMCO: "quantum.com",
    LAC: "lithiumamericas.com",
  };

  // ✅ ชื่อบริษัท
  const companyMap = {
    NVDA: "NVIDIA Corp",
    AAPL: "Apple Inc.",
    TSLA: "Tesla Inc.",
    MSFT: "Microsoft Corp",
    AMZN: "Amazon.com Inc.",
    META: "Meta Platforms Inc.",
    GOOG: "Alphabet Inc.",
    AMD: "Advanced Micro Devices",
    INTC: "Intel Corp",
    PLTR: "Palantir Technologies",
    IREN: "Iris Energy Ltd",
    RXRX: "Recursion Pharmaceuticals",
    RR: "Rolls-Royce Holdings",
    AEHR: "Aehr Test Systems",
    SLDP: "Solid Power Inc",
    NRGV: "Energy Vault Holdings",
    BBAI: "BigBear.ai Holdings",
    NVO: "Novo Nordisk A/S",
    GWH: "ESS Tech Inc",
    COST: "Costco Wholesale Corp",
    QUBT: "Quantum Computing Inc",
    UNH: "UnitedHealth Group",
    EZGO: "EZGO Technologies",
    QMCO: "Quantum Corp",
    LAC: "Lithium Americas",
  };

  // ✅ ดึงข้อมูลแต่ละหุ้น
  const fetchPrice = async (sym) => {
    try {
      const res = await fetch(`/api/visionary-eternal?type=daily&symbol=${sym}`);
      const json = await res.json();
      if (json && !json.error) {
        let signal = "Hold";
        if (json.trend === "Uptrend") signal = "Buy";
        else if (json.trend === "Downtrend") signal = "Sell";
        const company = json.companyName || companyMap[sym] || sym;
        const item = { ...json, signal, companyName: company };
        setData((prev) => {
          const existing = prev.find((x) => x.symbol === sym);
          if (existing) return prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x));
          return [...prev, item];
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (favorites?.length) favorites.forEach((sym) => fetchPrice(sym));
  }, [favorites]);

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
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          🔮 My Favorite Stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 border border-gray-700 rounded-md px-3 py-[4px] bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          ➕ Search
        </button>
      </div>

      {/* ✅ Flex Layout */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {favorites?.length ? (
          favorites.map((sym, i) => {
            const r = data.find((x) => x.symbol === sym);
            const domain = logoMap[sym] || `${sym.toLowerCase()}.com`;
            const companyName = r?.companyName || companyMap[sym] || "";

            return (
              <div
                key={sym + i}
                className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(sym)}
              >
                {/* โลโก้ + ชื่อหุ้น */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://logo.clearbit.com/${domain}`}
                      alt={sym}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://companieslogo.com/img/orig/${sym.toUpperCase()}_BIG.png`;
                        setTimeout(() => {
                          if (e.target.naturalWidth === 0 || e.target.naturalHeight === 0) {
                            e.target.style.display = "none";
                            const parent = e.target.parentNode;
                            if (parent && !parent.querySelector(".fallback-logo")) {
                              const span = document.createElement("span");
                              span.className = "fallback-logo text-emerald-400 font-bold text-[13px]";
                              span.textContent = sym[0];
                              parent.appendChild(span);
                            }
                          }
                        }, 800);
                      }}
                      className="w-9 h-9 object-contain transition-opacity duration-700 ease-in-out opacity-0"
                      onLoad={(e) => (e.target.style.opacity = 1)}
                    />
                  </div>

                  <div>
                    <a
                      href={`/analyze/${sym}`}
                      className="text-white hover:text-emerald-400 font-semibold text-[15px]"
                    >
                      {sym}
                    </a>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                      {companyName}
                    </div>
                  </div>
                </div>

                {/* ขวา: ราคา / RSI / สัญญาณ */}
                <div className="flex items-center space-x-3 font-mono pr-[3px] sm:pr-4">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {r?.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-semibold ${
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
                  </span>
                  <span
                    className={`text-[14px] font-bold ${
                      r?.signal === "Buy"
                        ? "text-green-400"
                        : r?.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r?.signal || "-"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500 italic">
            No favorites yet. Add one by searching ➕
          </div>
        )}
      </div>

      {/* Search Modal */}
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
