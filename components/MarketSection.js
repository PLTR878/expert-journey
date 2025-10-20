// ✅ MarketLikeFavorites — เชื่อมกับ visionary-core + visionary-scanner (V∞.6)
import { useRef, useState, useEffect } from "react";

export default function MarketLikeFavorites({
  dataList = [],
  rows = [],
  mode = "scanner", // 'scanner' | 'discovery'
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โหลดข้อมูลจาก API ใหม่
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      let url =
        mode === "scanner"
          ? `/api/visionary-scanner?type=scanner`
          : `/api/visionary-scanner?type=ai-discovery`;

      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();

      const arr =
        j.stocks || j.discovered || j.results || j.data || j.list || [];
      if (!Array.isArray(arr) || arr.length === 0)
        throw new Error("ไม่พบข้อมูลตลาด");

      // ✅ ดึงราคาล่าสุดจาก visionary-core
      const merged = await Promise.all(
        arr.map(async (r) => {
          const sym = r.symbol;
          try {
            const priceRes = await fetch(
              `/api/visionary-core?type=daily&symbol=${sym}`
            );
            const p = await priceRes.json();
            return {
              ...r,
              symbol: sym,
              price: p.lastClose || r.lastClose || r.price || 0,
              rsi: p.rsi || r.rsi || 0,
              trend:
                p.trend ||
                r.trend ||
                (p.rsi > 55 ? "Uptrend" : p.rsi < 45 ? "Downtrend" : "Sideway"),
              signal:
                r.signal ||
                (r.trend === "Uptrend"
                  ? "Buy"
                  : r.trend === "Downtrend"
                  ? "Sell"
                  : "Hold"),
            };
          } catch (e) {
            return r;
          }
        })
      );

      setList(merged);
      console.log(`✅ Loaded ${merged.length} stocks from ${mode}`);
    } catch (err) {
      console.error(`⚠️ Load ${mode} failed:`, err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ โหลดตอนเปิดหน้า
  useEffect(() => {
    fetchMarketData();
  }, [mode]);

  // ✅ ปุ่มรีโหลด
  const handleReload = async () => {
    await fetchMarketData();
  };

  // ✅ โลโก้
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

  // ✅ Touch event (ป้องกัน swipe)
  const handleTouchStart = (e) =>
    (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) =>
    (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // ✅ แสดงชื่อโหมด
  const title =
    mode === "scanner"
      ? "📡 สแกนหุ้นทั้งตลาด (AI Market Scanner)"
      : "🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery)";

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          {title}
        </h2>

        <button
          onClick={handleReload}
          className={`text-[12px] px-2 py-[3px] rounded-md border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 transition-all ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* ✅ แสดงจำนวนหุ้น */}
      <div className="text-[12px] text-gray-400 px-[4px] mb-2">
        {list?.length ? `พบหุ้นทั้งหมด ${list.length} ตัว` : "ไม่มีข้อมูลตลาด"}
      </div>

      {/* ✅ Layout */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {list?.length ? (
          list.map((r, i) => {
            const sym = r.symbol || "-";
            const domain = logoMap[sym] || `${sym.toLowerCase()}.com`;
            const companyName =
              r.companyName ||
              r.name ||
              r.fullName ||
              "Unknown Company";
            const price = r.price || r.lastClose || 0;
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
                      onError={(e) => (e.target.style.display = "none")}
                      className="w-9 h-9 object-contain"
                    />
                    {!logoMap[sym] && (
                      <span className="text-emerald-400 font-bold text-[13px]">
                        {sym[0]}
                      </span>
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
            {loading ? "⏳ กำลังโหลดข้อมูลตลาด..." : "No market data available."}
          </div>
        )}
      </div>
    </section>
  );
}
