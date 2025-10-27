// ✅ /components/Favorites.js — Visionary Favorites (OriginX Style Vertical RSI)
import { useState, useRef, useEffect } from "react";

export default function Favorites({ favorites, setFavorites }) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [imgError, setImgError] = useState({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โลโก้
  const logoMap = {
    NVDA: "nvidia.com", AAPL: "apple.com", TSLA: "tesla.com", MSFT: "microsoft.com",
    AMZN: "amazon.com", META: "meta.com", GOOG: "google.com", AMD: "amd.com",
    INTC: "intel.com", PLTR: "palantir.com", IREN: "irisenergy.co", RXRX: "recursion.com",
    RR: "rolls-royce.com", AEHR: "aehr.com", SLDP: "solidpowerbattery.com",
    NRGV: "energyvault.com", BBAI: "bigbear.ai", NVO: "novonordisk.com", GWH: "esstech.com",
    COST: "costco.com", QUBT: "quantumcomputinginc.com", UNH: "uhc.com", EZGO: "ezgoev.com",
    QMCO: "quantum.com", LAC: "lithiumamericas.com",
  };

  const companyMap = {
    NVDA: "NVIDIA Corp", AAPL: "Apple Inc.", TSLA: "Tesla Inc.", MSFT: "Microsoft Corp",
    AMZN: "Amazon.com Inc.", META: "Meta Platforms Inc.", GOOG: "Alphabet Inc.",
    AMD: "Advanced Micro Devices", INTC: "Intel Corp", PLTR: "Palantir Technologies",
    IREN: "Iris Energy Ltd", RXRX: "Recursion Pharmaceuticals", RR: "Rolls-Royce Holdings",
    AEHR: "Aehr Test Systems", SLDP: "Solid Power Inc", NRGV: "Energy Vault Holdings",
    BBAI: "BigBear.ai Holdings", NVO: "Novo Nordisk A/S", GWH: "ESS Tech Inc",
    COST: "Costco Wholesale Corp", QUBT: "Quantum Computing Inc", UNH: "UnitedHealth Group",
    EZGO: "EZGO Technologies", QMCO: "Quantum Corp", LAC: "Lithium Americas",
  };

  const fetchStockData = async (sym) => {
    try {
      const coreRes = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
      const core = await coreRes.json();

      let price = core?.lastClose ?? 0;
      let rsi = core?.rsi ?? 50;
      let trend = core?.trend ?? null;
      let company = core?.companyName || companyMap[sym] || sym;

      if (!price || !trend) {
        try {
          const infRes = await fetch(`/api/visionary-infinite-core?symbol=${sym}`, { cache: "no-store" });
          const inf = await infRes.json();
          price = price || inf?.lastClose || 0;
          rsi = rsi || inf?.rsi || 50;
          trend = trend || inf?.trend || (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
          company = company || inf?.companyName || sym;
        } catch {}
      }

      const finalTrend = trend || (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
      const signal = finalTrend === "Uptrend" ? "Buy" : finalTrend === "Downtrend" ? "Sell" : "Hold";

      const item = { symbol: sym, companyName: company, lastClose: price, rsi, signal };

      setData((prev) => {
        const existing = prev.find((x) => x.symbol === sym);
        return existing
          ? prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x))
          : [...prev, item];
      });
    } catch (err) {
      console.error(`❌ Fetch error ${sym}:`, err);
    }
  };

  useEffect(() => {
    if (favorites?.length > 0) favorites.forEach((sym) => fetchStockData(sym));
  }, [favorites]);

  const handleSubmit = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!stored.includes(sym)) {
      const updated = [...stored, sym];
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      await fetchStockData(sym);
    }

    setSymbol("");
    setShowModal(false);
  };

  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setData((prev) => prev.filter((x) => x.symbol !== sym));
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

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {favorites?.length ? (
          favorites.map((sym, i) => {
            const r = data.find((x) => x.symbol === sym);
            const domain = logoMap[sym] || `${sym.toLowerCase()}.com`;
            const companyName = r?.companyName || companyMap[sym] || "";

            return (
              <div
                key={sym + i}
                className="flex items-center justify-between py-[10px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(sym)}
              >
                {/* โลโก้ + ชื่อ */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[sym] ? (
                      <div className="w-full h-full bg-white flex flex-col items-center justify-center rounded-full border border-gray-300">
                        <span className="text-black font-extrabold text-[11px] uppercase tracking-tight mt-[3px]">
                          {sym}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={`https://logo.clearbit.com/${domain}`}
                        alt={sym}
                        onError={() => setImgError((p) => ({ ...p, [sym]: true }))}
                        className="w-full h-full object-cover rounded-full"
                      />
                    )}
                  </div>
                  <div>
                    <a
                      href={`/analyze/${sym}`}
                      className="text-white hover:text-emerald-400 font-extrabold text-[15px]"
                    >
                      {sym}
                    </a>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[160px] leading-snug">
                      {companyName}
                    </div>
                  </div>
                </div>

                {/* ราคา + RSI + Signal (แนวตั้งเหมือน OriginX) */}
                <div className="text-right leading-tight font-mono min-w-[75px]">
                  <div className="text-[15px] text-white font-black">
                    {r?.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                  </div>
                  <div
                    className={`text-[13px] font-bold ${
                      r?.rsi > 70
                        ? "text-red-400"
                        : r?.rsi < 40
                        ? "text-blue-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {r?.rsi ? Math.round(r.rsi) : "-"}
                  </div>
                  <div
                    className={`text-[13px] font-extrabold ${
                      r?.signal === "Buy"
                        ? "text-green-400"
                        : r?.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r?.signal || "-"}
                  </div>
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

      {/* 🔍 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111827] rounded-2xl shadow-xl p-5 w-[80%] max-w-xs text-center border border-gray-700 -translate-y-14">
            <h3 className="text-lg text-emerald-400 font-bold mb-3">Search Stock</h3>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="พิมพ์ชื่อย่อหุ้น เช่น NVDA, TSLA"
              className="w-full text-center bg-[#0d121d]/90 border border-gray-700 text-gray-100 rounded-md py-[9px]
              focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-4 text-[14px] font-semibold"
            />
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
