// ✅ /components/MarketSection.js — OriginX Top Picks (Fixed List)
import { useState, useEffect } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);

  // รายชื่อหุ้นจากรูปทั้งหมด
  const topStocks = [
    "SOFI", "HASI", "RIVN", "LWLG", "SOUN", "AXTI", "LAES",
    "RXRX", "NRGV", "WULF", "DNA", "BYND", "OSCR", "BBAI",
    "ACHR", "PATH", "MVIS", "SES", "KSCP", "CCCX", "RKLB",
    "ASTS", "CRSP", "SLDP", "ENVX"
  ];

  // map domain โลโก้
  const logoMap = {
    SOFI: "sofi.com",
    HASI: "hannonarmstrong.com",
    RIVN: "rivian.com",
    LWLG: "lightwavelogic.com",
    SOUN: "soundhound.com",
    AXTI: "axt.com",
    LAES: "sealsq.com",
    RXRX: "recursion.com",
    NRGV: "energyvault.com",
    WULF: "terawulf.com",
    DNA: "ginkgobioworks.com",
    BYND: "beyondmeat.com",
    OSCR: "oscarhealth.com",
    BBAI: "bigbear.ai",
    ACHR: "archer.com",
    PATH: "uipath.com",
    MVIS: "microvision.com",
    SES: "ses.ai",
    KSCP: "knightscope.com",
    CCCX: "churchillcapital.com",
    RKLB: "rocketlabusa.com",
    ASTS: "ast-science.com",
    CRSP: "crisprtx.com",
    SLDP: "solidpowerbattery.com",
    ENVX: "enovix.com"
  };

  // ดึงข้อมูลจาก API
  const fetchStockData = async (sym) => {
    try {
      const coreRes = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
      const core = await coreRes.json();
      let price = core?.lastClose ?? 0;
      let rsi = core?.rsi ?? 50;
      let trend = core?.trend ?? (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
      let signal = trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";

      setData((prev) => [
        ...prev.filter((x) => x.symbol !== sym),
        { symbol: sym, price, rsi, trend, signal }
      ]);
    } catch (err) {
      console.error("❌ Error:", sym, err);
    }
  };

  useEffect(() => {
    topStocks.forEach((s) => fetchStockData(s));
  }, []);

  // เรียง RSI สูง -> ต่ำ
  const sorted = [...data].sort((a, b) => (b.rsi || 0) - (a.rsi || 0));

  return (
    <section className="w-full px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[22px] font-extrabold text-white uppercase flex items-center gap-2">
          🚀 OriginX Top Picks
        </h2>
      </div>

      {sorted.length ? (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {sorted.map((r, i) => (
            <div
              key={r.symbol}
              className="flex items-center justify-between py-[10px] px-2 hover:bg-[#111827]/40 transition-all"
            >
              {/* โลโก้ + ลำดับ */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-[10px] text-gray-400 font-bold">
                    {i + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] overflow-hidden flex items-center justify-center">
                    <img
                      src={`https://logo.clearbit.com/${logoMap[r.symbol] || r.symbol.toLowerCase() + ".com"}`}
                      alt={r.symbol}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-white font-bold text-[15px]">{r.symbol}</div>
                  <div
                    className={`text-[11px] font-medium ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal}
                  </div>
                </div>
              </div>

              {/* ราคา / RSI */}
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[14px] text-gray-100 font-semibold">
                  {r.price ? `$${r.price.toFixed(2)}` : "-"}
                </span>
                <span
                  className={`text-[14px] font-bold ${
                    r.rsi > 70 ? "text-red-400" : r.rsi < 40 ? "text-blue-400" : "text-emerald-400"
                  }`}
                >
                  {r.rsi ? Math.round(r.rsi) : "-"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-500 italic">⏳ กำลังโหลดข้อมูล...</div>
      )}
    </section>
  );
                        }
