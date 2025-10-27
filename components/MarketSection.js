// ✅ /components/MarketSection.js — OriginX Top Picks (Ranked AI Selection)
import { useState, useEffect } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);
  const [imgError, setImgError] = useState({});

  // ✅ หุ้น Top ที่เลือกไว้ล่วงหน้า
  const topStocks = [
    "PLTR", "AEHR", "RXRX", "NRGV", "GWH", "IREN", 
    "SLDP", "BBAI", "NVO", "EYPT", "ACHR", "SOFI", 
    "PATH", "SES", "KSCP", "LWLG"
  ];

  // ✅ ชื่อบริษัท
  const companyMap = {
    PLTR: "Palantir Technologies",
    AEHR: "Aehr Test Systems",
    RXRX: "Recursion Pharmaceuticals",
    NRGV: "Energy Vault Holdings",
    GWH: "ESS Tech Inc",
    IREN: "Iris Energy Ltd",
    SLDP: "Solid Power Inc",
    BBAI: "BigBear.ai Holdings",
    NVO: "Novo Nordisk A/S",
    EYPT: "EyePoint Pharmaceuticals",
    ACHR: "Archer Aviation Inc",
    SOFI: "SoFi Technologies Inc",
    PATH: "UiPath Inc",
    SES: "SES AI Corporation",
    KSCP: "Knightscope Inc",
    LWLG: "Lightwave Logic Inc",
  };

  // ✅ ดึงข้อมูลจาก API (core + infinite-core)
  const fetchStockData = async (sym) => {
    try {
      const coreRes = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
      const core = await coreRes.json();

      let price = core?.lastClose ?? 0;
      let rsi = core?.rsi ?? 50;
      let trend = core?.trend ?? (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
      let company = core?.companyName || companyMap[sym] || sym;

      if (!price || !rsi) {
        try {
          const infRes = await fetch(`/api/visionary-infinite-core?symbol=${sym}`, { cache: "no-store" });
          const inf = await infRes.json();
          price = inf?.lastClose ?? price;
          rsi = inf?.rsi ?? rsi;
          trend = inf?.trend ?? trend;
          company = inf?.companyName || company;
        } catch {}
      }

      const signal =
        trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";

      const item = { symbol: sym, companyName: company, lastClose: price, rsi, trend, signal };

      setData((prev) => {
        const exist = prev.find((x) => x.symbol === sym);
        return exist
          ? prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x))
          : [...prev, item];
      });
    } catch (err) {
      console.error(`❌ Fetch error ${sym}:`, err);
    }
  };

  useEffect(() => {
    topStocks.forEach((sym) => fetchStockData(sym));
  }, []);

  // ✅ จัดอันดับ RSI จากสูง → ต่ำ
  const ranked = [...data].sort((a, b) => (b?.rsi || 0) - (a?.rsi || 0));

  // ✅ โลโก้หลัก
  const logoMap = {
    PLTR: "palantir.com",
    AEHR: "aehr.com",
    RXRX: "recursion.com",
    NRGV: "energyvault.com",
    GWH: "esstech.com",
    IREN: "irisenergy.co",
    SLDP: "solidpowerbattery.com",
    BBAI: "bigbear.ai",
    NVO: "novonordisk.com",
    EYPT: "eyepointpharma.com",
    ACHR: "archer.com",
    SOFI: "sofi.com",
    PATH: "uipath.com",
    SES: "ses.ai",
    KSCP: "knightscope.com",
    LWLG: "lightwavelogic.com",
  };

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* ✅ Header */}
      <div className="flex justify-between items-center mb-4 px-[2px] sm:px-2">
        <h2 className="text-[22px] font-extrabold text-white tracking-tight uppercase font-sans flex items-center gap-2">
          🚀 OriginX Top Picks
        </h2>
        <span className="text-[13px] text-gray-400">
          {ranked.length ? `รวม ${ranked.length} ตัว` : "กำลังโหลด..."}
        </span>
      </div>

      {/* ✅ ตารางหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {ranked.length ? (
          ranked.map((r, i) => {
            const sym = r.symbol;
            const domain = logoMap[sym] || `${sym.toLowerCase()}.com`;

            return (
              <div
                key={sym}
                className="flex items-center justify-between py-[12px] px-[6px] sm:px-3 hover:bg-[#111827]/40 transition-all"
              >
                {/* โลโก้ + ชื่อ */}
                <div className="flex items-center space-x-3">
                  <div className="relative w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[sym] ? (
                      <div className="w-full h-full bg-white flex flex-col items-center justify-center rounded-full border border-gray-300">
                        <span className="text-black font-extrabold text-[10px] uppercase tracking-tight">
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
                    <span className="absolute -top-1 -left-1 bg-emerald-500/80 text-[10px] font-bold text-white rounded-full w-[16px] h-[16px] flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>

                  <div>
                    <div className="text-white font-semibold text-[15px]">{sym}</div>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">
                      {r.companyName}
                    </div>
                  </div>
                </div>

                {/* ขวา */}
                <div className="flex items-center space-x-3 font-mono pr-[3px] sm:pr-4">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {r?.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-semibold ${
                      r?.rsi > 70
                        ? "text-red-400"
                        : r?.rsi < 40
                        ? "text-blue-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {Math.round(r.rsi || 0)}
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
                    {r?.signal}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500 italic">กำลังโหลดข้อมูล...</div>
        )}
      </div>
    </section>
  );
        }
