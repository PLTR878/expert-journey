// ✅ /components/MarketSection.js — Visionary Discovery (เหมือน Favorites ทุกอย่าง)
import { useState, useRef, useEffect } from "react";

export default function MarketSection() {
  const [stocks, setStocks] = useState([]);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [imgError, setImgError] = useState({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โหลดจาก localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("discovery-stocks");
      if (saved) setStocks(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("discovery-stocks", JSON.stringify(stocks));
    } catch {}
  }, [stocks]);

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

  // ✅ ดึงข้อมูลจาก API
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

      const item = { symbol: sym, companyName: company, lastClose: price, rsi, trend: finalTrend, signal };

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
    if (stocks?.length > 0) stocks.forEach((sym) => fetchStockData(sym));
  }, [stocks]);

  // ✅ เพิ่มหุ้น
  const handleSubmit = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if (!stocks.includes(sym)) {
      const updated = [...stocks, sym];
      setStocks(updated);
      localStorage.setItem("discovery-stocks", JSON.stringify(updated));
      await fetchStockData(sym);
    }
    setSymbol("");
    setShowModal(false);
  };

  // ✅ ลบหุ้น
  const removeStock = (sym) => {
    const updated = stocks.filter((s) => s !== sym);
    setStocks(updated);
    localStorage.setItem("discovery-stocks", JSON.stringify(updated));
    setData((prev) => prev.filter((x) => x.symbol !== sym));
  };

  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (sym) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 70) removeStock(sym);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 border border-gray-700 rounded-md px-3 py-[4px] bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          ➕ Add
        </button>
      </div>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {stocks?.length ? (
          stocks.map((sym, i) => {
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
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[sym] ? (
                      <div className="w-full h-full bg-white flex flex-col items-center justify-center rounded-full border border-gray-300">
                        <span
                          className="text-black font-extrabold text-[11px] uppercase tracking-tight mt-[3px]"
                          style={{
                            fontFamily: `'Poppins', 'Roboto Mono', sans-serif`,
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {sym}
                        </span>
                        <span className="text-[8px] text-gray-700 font-semibold leading-none mt-[1px]">
                          ➕
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
                      className="text-white hover:text-emerald-400 font-semibold text-[15px]"
                    >
                      {sym}
                    </a>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                      {companyName}
                    </div>
                  </div>
                </div>

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

      {/* 🔍 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111827] rounded-2xl shadow-xl p-5 w-[80%] max-w-xs text-center border border-gray-700 -translate-y-14">
            <h3 className="text-lg text-emerald-400 font-bold mb-3">Add Stock</h3>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="พิมพ์ชื่อย่อหุ้น เช่น AEHR, PLTR"
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
