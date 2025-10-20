import { useRef } from "react";

export default function MarketLikeFavorites({ dataList = [], rows = [] }) {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ รวมข้อมูลจาก props ให้แน่ใจว่าไม่ว่าง และป้องกัน array ซ้อน
  let list = dataList?.length ? dataList : rows || [];
  if (Array.isArray(list[0])) list = list.flat();

  // ✅ Debug ดูว่ามีกี่หุ้นที่โหลดมา
  console.log("📊 MarketLikeFavorites loaded:", list.length, "stocks");

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

  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          ⚡ Market Overview
        </h2>
      </div>

      {/* ✅ Layout เหมือน Favorites */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {list?.length ? (
          list.map((r, i) => {
            const sym = r.symbol;
            const domain = logoMap[sym] || `${sym?.toLowerCase?.()}.com`;
            const companyName = r.companyName || companyMap[sym] || sym;
            const price = r.lastClose || r.price || 0;
            const rsi = r.rsi;
            const signal =
              r.signal ||
              (r.trend === "Uptrend"
                ? "Buy"
                : r.trend === "Downtrend"
                ? "Sell"
                : "Hold");

            return (
              <div
                key={sym + i}
                className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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

                    {/* ✅ เหตุผลจาก AI */}
                    {r.reason && (
                      <div className="text-[10px] text-emerald-400 mt-[2px] max-w-[160px] truncate">
                        📈 {r.reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* ขวา: ราคา / RSI / สัญญาณ */}
                <div className="flex items-center space-x-3 font-mono pr-[3px] sm:pr-4">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {price ? `$${Number(price).toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-semibold ${
                      typeof rsi === "number"
                        ? rsi > 70
                          ? "text-red-400"
                          : rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {typeof rsi === "number" ? Math.round(rsi) : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-bold ${
                      signal === "Buy"
                        ? "text-green-400"
                        : signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {signal}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500 italic">
            No market data available.
          </div>
        )}
      </div>
    </section>
  );
}
