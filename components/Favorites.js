// ✅ /components/Favorites.js — Visionary Favorites (Smart Logo Final)
import { useState, useRef, useEffect } from "react";

// ✅ รายชื่อหุ้นที่ “มีโลโก้จริง” (ไม่ต้องแตะ)
const hasRealLogo = [
  "NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META", "GOOG", "AMD", "INTC",
  "PLTR", "IREN", "RXRX", "NVO", "COST", "UNH", "SLDP", "NRGV", "GWH", "BBAI"
];

// ✅ โลโก้อัจฉริยะ (TradingView → Clearbit → fallback เป็นชื่อบริษัท)
function StockLogo({ sym, name, imgError, setImgError }) {
  const tradingView = `https://s3-symbol-logo.tradingview.com/${sym.toLowerCase()}.svg`;
  const clearbit = `https://logo.clearbit.com/${sym.toLowerCase()}.com`;

  // ถ้ามีโลโก้จริงอยู่แล้ว → ใช้ TradingView อย่างเดียว
  if (hasRealLogo.includes(sym)) {
    return (
      <img
        src={tradingView}
        alt={sym}
        onError={() => setImgError((p) => ({ ...p, [sym]: "tv" }))}
        className="w-full h-full object-contain p-[3px]"
      />
    );
  }

  // ถ้าโหลด TradingView ไม่ได้ → ลอง Clearbit
  if (imgError[sym] === "tv") {
    return (
      <img
        src={clearbit}
        alt={sym}
        onError={() => setImgError((p) => ({ ...p, [sym]: "none" }))}
        className="w-full h-full object-contain rounded-full bg-[#0b0f17]"
      />
    );
  }

  // ถ้าไม่มีโลโก้เลย → ใช้ชื่อบริษัทพื้นขาวตัวดำ
  if (imgError[sym] === "none") {
    return (
      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-black bg-white rounded-full text-center p-[3px] leading-tight">
        {name.length > 12 ? name.slice(0, 12) + "…" : name}
      </div>
    );
  }

  // เริ่มจาก TradingView ก่อน
  return (
    <img
      src={tradingView}
      alt={sym}
      onError={() => setImgError((p) => ({ ...p, [sym]: "tv" }))}
      className="w-full h-full object-contain p-[3px]"
    />
  );
}

export default function Favorites({ favorites, setFavorites }) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [imgError, setImgError] = useState({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const companyMap = {
    NVDA: "NVIDIA Corp", AAPL: "Apple Inc.", TSLA: "Tesla Inc.",
    MSFT: "Microsoft Corp", AMZN: "Amazon.com Inc.", META: "Meta Platforms Inc.",
    GOOG: "Alphabet Inc.", AMD: "Advanced Micro Devices", INTC: "Intel Corp",
    PLTR: "Palantir Technologies", IREN: "Iris Energy Ltd", RXRX: "Recursion Pharmaceuticals",
    RR: "Rolls-Royce Holdings", AEHR: "Aehr Test Systems", SLDP: "Solid Power Inc",
    NRGV: "Energy Vault Holdings", BBAI: "BigBear.ai Holdings", NVO: "Novo Nordisk A/S",
    GWH: "ESS Tech Inc", COST: "Costco Wholesale Corp", QUBT: "Quantum Computing Inc",
    UNH: "UnitedHealth Group", EZGO: "EZGO Technologies", QMCO: "Quantum Corp",
    LAC: "Lithium Americas", EYPT: "EyePoint Pharmaceuticals", CLF: "Cleveland-Cliffs Inc",
  };

  // ✅ ดึงข้อมูลหุ้น
  const fetchStockData = async (sym) => {
    try {
      const coreRes = await fetch(`/api/visionary-core?type=daily&symbol=${sym}`);
      const core = await coreRes.json();
      const scanRes = await fetch(`/api/visionary-scanner?type=single&symbol=${sym}`);
      const scan = await scanRes.json();

      const price = core?.lastClose ?? scan?.price ?? 0;
      const rsi = core?.rsi ?? scan?.rsi ?? 50;
      const trend =
        core?.trend ?? scan?.trend ?? (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
      const signal =
        scan?.signal ?? (trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold");
      const company = core?.companyName || companyMap[sym] || sym;

      const item = { symbol: sym, companyName: company, lastClose: price, rsi, trend, signal };

      setData((prev) => {
        const existing = prev.find((x) => x.symbol === sym);
        if (existing) return prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x));
        return [...prev, item];
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

    if (!favorites.includes(sym)) {
      const updated = [...favorites, sym];
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      await fetchStockData(sym);
    }
    setSymbol("");
    setShowModal(false);
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

  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setData((prev) => prev.filter((x) => x.symbol !== sym));
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

      {/* รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {favorites?.length ? (
          favorites.map((sym, i) => {
            const r = data.find((x) => x.symbol === sym);
            const companyName = r?.companyName || companyMap[sym] || sym;

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
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    <StockLogo
                      sym={sym}
                      name={companyName}
                      imgError={imgError}
                      setImgError={setImgError}
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

                {/* ราคา / RSI / สัญญาณ */}
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
    </section>
  );
        }
