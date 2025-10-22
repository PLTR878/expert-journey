// ✅ /components/MarketSection.js — เหมือน Favorites แต่ไม่มีปุ่มค้นหา
import { useState, useEffect } from "react";

export default function MarketSection({ title = "🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)", rows = [] }) {
  const [data, setData] = useState([]);
  const [imgError, setImgError] = useState({});

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

  // ✅ โหลดข้อมูล
  useEffect(() => {
    if (rows?.length > 0) {
      setData(rows);
    }
  }, [rows]);

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          {title}
        </h2>
        <span className="text-[12px] text-gray-400">
          {rows.length ? `ทั้งหมด ${rows.length} ตัว` : "—"}
        </span>
      </div>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {rows?.length ? (
          rows.map((r, i) => {
            const sym = r.symbol?.toUpperCase() || "-";
            const domain = logoMap[sym] || `${sym.toLowerCase()}.com`;

            return (
              <div
                key={sym + i}
                className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
              >
                {/* โลโก้ + ชื่อหุ้น */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[sym] ? (
                      <span className="text-emerald-400 font-bold text-[13px]">
                        {sym[0]}
                      </span>
                    ) : (
                      <img
                        src={`https://logo.clearbit.com/${domain}`}
                        alt={sym}
                        onError={() =>
                          setImgError((p) => ({ ...p, [sym]: true }))
                        }
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
                      {r.reason || "AI วิเคราะห์ศักยภาพในอนาคต"}
                    </div>
                  </div>
                </div>

                {/* ขวา: ราคา / RSI / สัญญาณ */}
                <div className="flex items-center space-x-3 font-mono pr-[3px] sm:pr-4">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {r.price ? `$${r.price.toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-semibold ${
                      typeof r.rsi === "number"
                        ? r.rsi > 70
                          ? "text-red-400"
                          : r.rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {typeof r.rsi === "number" ? Math.round(r.rsi) : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-bold ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal || "Hold"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500 italic">
            ไม่มีข้อมูลในพอร์ต AI
          </div>
        )}
      </div>
    </section>
  );
          }
