// ✅ /components/Discovery.js — หุ้นต้นน้ำ (Manual Input Version)
import { useState, useRef, useEffect } from "react";

export default function Discovery() {
  // ✅ เริ่มต้นด้วยหุ้น AEHR
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("discovery-stocks");
      return stored ? JSON.parse(stored) : ["AEHR"];
    }
    return ["AEHR"];
  });

  const [data, setData] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [imgError, setImgError] = useState({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โลโก้หุ้น
  const logoMap = {
    AEHR: "aehr.com",
    PLTR: "palantir.com",
    SLDP: "solidpowerbattery.com",
    NRGV: "energyvault.com",
    GWH: "esstech.com",
    RXRX: "recursion.com",
    BBAI: "bigbear.ai",
    IREN: "irisenergy.co",
    NVO: "novonordisk.com",
  };

  // ✅ ชื่อบริษัท
  const companyMap = {
    AEHR: "Aehr Test Systems",
    PLTR: "Palantir Technologies",
    SLDP: "Solid Power Inc",
    NRGV: "Energy Vault Holdings",
    GWH: "ESS Tech Inc",
    RXRX: "Recursion Pharmaceuticals",
    BBAI: "BigBear.ai Holdings",
    IREN: "Iris Energy Ltd",
    NVO: "Novo Nordisk A/S",
  };

  // ✅ ดึงข้อมูลจาก API
  const fetchStockData = async (sym) => {
    try {
      const coreRes = await fetch(`/api/visionary-core?type=daily&symbol=${sym}`);
      const core = await coreRes.json();

      const price = core?.lastClose ?? 0;
      const rsi = core?.rsi ?? 50;
      const trend = core?.trend ?? (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
      const signal = trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";
      const company = core?.companyName || companyMap[sym] || sym;

      const item = { symbol: sym, companyName: company, lastClose: price, rsi, signal };

      setData((prev) => {
        const existing = prev.find((x) => x.symbol === sym);
        if (existing) return prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x));
        return [...prev, item];
      });
    } catch (err) {
      console.error(`❌ Fetch error ${sym}:`, err);
    }
  };

  // ✅ โหลดข้อมูลทั้งหมด
  useEffect(() => {
    if (favorites?.length > 0) favorites.forEach((sym) => fetchStockData(sym));
  }, [favorites]);

  // ✅ เพิ่มหุ้นใหม่
  const handleAdd = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    if (!favorites.includes(sym)) {
      const updated = [...favorites, sym];
      setFavorites(updated);
      localStorage.setItem("discovery-stocks", JSON.stringify(updated));
      await fetchStockData(sym);
    }
    setSymbol("");
  };

  // ✅ ลบรายการ
  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    setFavorites(updated);
    localStorage.setItem("discovery-stocks", JSON.stringify(updated));
    setData((prev) => prev.filter((x) => x.symbol !== sym));
  };

  // ✅ ลบด้วยการ swipe
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
      <div className="flex justify-between items-center mb-4 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)
        </h2>
        <span className="text-[12px] text-gray-400">
          {favorites.length ? `ทั้งหมด ${favorites.length} ตัว` : "—"}
        </span>
      </div>

      {/* ✅ ช่องใส่หุ้น */}
      <div className="flex items-center mb-4 gap-2 px-2">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="พิมพ์ชื่อย่อหุ้น เช่น PLTR, RXRX"
          className="flex-1 bg-[#0d121d]/90 border border-gray-700 text-gray-100 rounded-md py-[9px] px-3
                     focus:outline-none focus:ring-1 focus:ring-emerald-400 text-[14px] font-semibold"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-[9px] bg-emerald-500/80 hover:bg-emerald-500 rounded-md text-white font-bold text-sm"
        >
          Add
        </button>
      </div>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {favorites.length ? (
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
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[sym] ? (
                      <span className="text-emerald-400 font-bold text-[13px]">{sym[0]}</span>
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
            ยังไม่มีหุ้นในรายการ กรุณาเพิ่มด้านบน ➕
          </div>
        )}
      </div>
    </section>
  );
        }
