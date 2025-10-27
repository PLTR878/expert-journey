// ✅ /components/MarketSection.js — OriginX (ปรับสมบูรณ์)
import { useState, useEffect, useRef } from "react";

export default function MarketSection() {
  const [stocks, setStocks] = useState([
    "LAES","PATH","WULF","AXTI","CCCX","RXRX","SOFI","RKLB","LWLG","ASTS",
    "IREN","BBAI","GWH","PLUG","NVDA","AEHR","NRGV","CRSP","ACHR","MVIS",
    "KSCP","SLDP","SES","OSCR","HASI",
  ]);
  const [data, setData] = useState([]);
  const [imgError, setImgError] = useState({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โลโก้
  const logoMap = {
    LAES: "sealsq.com",
    PATH: "uipath.com",
    WULF: "terawulf.com",
    AXTI: "axt.com",
    CCCX: "churchillcapital.com",
    RXRX: "recursion.com",
    SOFI: "sofi.com",
    RKLB: "rocketlabusa.com",
    LWLG: "lightwavelogic.com",
    ASTS: "ast-science.com",
    IREN: "irisenergy.co",
    BBAI: "bigbear.ai",
    GWH: "esstech.com",
    PLUG: "plugpower.com",
    NVDA: "nvidia.com",
    AEHR: "aehr.com",
    NRGV: "energyvault.com",
    CRSP: "crisprtx.com",
    ACHR: "archer.com",
    MVIS: "microvision.com",
    KSCP: "knightscope.com",
    SLDP: "solidpowerbattery.com",
    SES: "ses.ai",
    OSCR: "oscarhealth.com",
    HASI: "hannonarmstrong.com",
  };

  // ✅ ดึงข้อมูล
  const fetchStockData = async (sym) => {
    try {
      const res = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
      const d = await res.json();

      const price = d?.lastClose ?? 0;
      const rsi = d?.rsi ?? 50;
      const signal =
        rsi > 60 ? "Buy" : rsi < 40 ? "Sell" : "Hold";

      const updated = { symbol: sym, price, rsi, signal, company: d?.companyName || sym };
      setData((prev) => {
        const exists = prev.find((x) => x.symbol === sym);
        return exists
          ? prev.map((x) => (x.symbol === sym ? updated : x))
          : [...prev, updated];
      });
    } catch (err) {
      console.log("❌ Error", sym, err);
    }
  };

  // ✅ โหลดหุ้นทั้งหมด
  useEffect(() => {
    stocks.forEach((sym) => fetchStockData(sym));

    // 🔁 อัปเดตทุก 1 นาที
    const interval = setInterval(() => {
      stocks.forEach((sym) => fetchStockData(sym));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ✅ ลบหุ้น (ถ้าปัดซ้าย)
  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (sym) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const dist = touchStartX.current - touchEndX.current;
    if (dist > 70) setData((prev) => prev.filter((x) => x.symbol !== sym));
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="w-full px-[8px] sm:px-4 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      <h2 className="text-[22px] font-extrabold text-white tracking-tight uppercase font-sans flex items-center gap-2 mb-3">
        🚀 OriginX Picks
      </h2>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {data.length ? (
          data.map((r, i) => {
            const domain = logoMap[r.symbol] || `${r.symbol.toLowerCase()}.com`;
            return (
              <div
                key={r.symbol + i}
                className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(r.symbol)}
              >
                {/* โลโก้ + ชื่อ */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[r.symbol] ? (
                      <span className="text-[10px] font-bold text-white">{r.symbol}</span>
                    ) : (
                      <img
                        src={`https://logo.clearbit.com/${domain}`}
                        alt={r.symbol}
                        onError={() => setImgError((p) => ({ ...p, [r.symbol]: true }))}
                        className="w-full h-full object-cover rounded-full"
                      />
                    )}
                  </div>

                  <div>
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="text-white hover:text-emerald-400 font-semibold text-[15px]"
                    >
                      {r.symbol}
                    </a>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                      {r.company}
                    </div>
                  </div>
                </div>

                {/* ราคา + RSI + สัญญาณ */}
                <div className="flex flex-col items-end font-mono pr-[3px] sm:pr-4 leading-tight">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {r.price ? `$${r.price.toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[13px] font-semibold ${
                      r.rsi > 70
                        ? "text-red-400"
                        : r.rsi < 40
                        ? "text-blue-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {Math.round(r.rsi)}
                  </span>
                  <span
                    className={`text-[13px] font-bold ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500 italic">Loading...</div>
        )}
      </div>
    </section>
  );
                                  }
