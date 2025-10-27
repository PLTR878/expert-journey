// ✅ /components/MarketSection.js — OriginX Picks (เวอร์ชันลูกค้าเห็น)
import { useEffect, useState } from "react";

export default function MarketSection() {
  const [imgError, setImgError] = useState({});

  // ✅ หุ้นที่คัดมาเอง (แก้ได้ตามต้องการ)
  const picks = [
    { symbol: "LAES", name: "SEALSQ Corp", price: 6.71, rsi: 62.66, signal: "Buy" },
    { symbol: "PATH", name: "UiPath Inc.", price: 17.34, rsi: 60.71, signal: "Buy" },
    { symbol: "WULF", name: "TeraWulf Inc.", price: 13.63, rsi: 59.91, signal: "Buy" },
    { symbol: "AXTI", name: "AXT Inc.", price: 6.12, rsi: 58.56, signal: "Buy" },
    { symbol: "CCCX", name: "Churchill Capital Corp X", price: 22.25, rsi: 57.88, signal: "Buy" },
    { symbol: "RXRX", name: "Recursion Pharmaceuticals", price: 6.10, rsi: 57.05, signal: "Buy" },
    { symbol: "SOFI", name: "SoFi Technologies Inc.", price: 29.82, rsi: 56.70, signal: "Buy" },
    { symbol: "RKLB", name: "Rocket Lab Corp.", price: 65.01, rsi: 56.39, signal: "Buy" },
    { symbol: "LWLG", name: "Lightwave Logic Inc.", price: 4.87, rsi: 52.33, signal: "Buy" },
    { symbol: "ASTS", name: "AST SpaceMobile Inc.", price: 76.99, rsi: 51.85, signal: "Buy" },
    { symbol: "RIVN", name: "Rivian Automotive Inc.", price: 13.31, rsi: 51.00, signal: "Sell" },
    { symbol: "SOUN", name: "SoundHound AI Inc.", price: 18.25, rsi: 50.23, signal: "Buy" },
    { symbol: "ENVX", name: "Enovix Corp.", price: 12.30, rsi: 49.24, signal: "Buy" },
    { symbol: "SES", name: "SES AI Corp.", price: 2.44, rsi: 45.59, signal: "Hold" },
    { symbol: "BBAI", name: "BigBear.ai Holdings", price: 6.91, rsi: 44.97, signal: "Hold" },
    { symbol: "SLDP", name: "Solid Power Inc.", price: 5.74, rsi: 44.40, signal: "Buy" },
    { symbol: "CRSP", name: "CRISPR Therapeutics AG", price: 65.14, rsi: 42.81, signal: "Hold" },
    { symbol: "ACHR", name: "Archer Aviation Inc.", price: 11.38, rsi: 41.04, signal: "Buy" },
    { symbol: "OSCR", name: "Oscar Health Inc.", price: 19.45, rsi: 38.07, signal: "Hold" },
    { symbol: "KSCP", name: "Knightscope Inc.", price: 5.69, rsi: 35.40, signal: "Sell" },
    { symbol: "MVIS", name: "MicroVision Inc.", price: 1.23, rsi: 35.34, signal: "Hold" },
    { symbol: "HASI", name: "Hannon Armstrong", price: 28.65, rsi: 34.16, signal: "Hold" },
  ];

  // ✅ โลโก้จริง (Clearbit)
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
    RIVN: "rivian.com",
    SOUN: "soundhound.com",
    ENVX: "enovix.com",
    SES: "ses.ai",
    BBAI: "bigbear.ai",
    SLDP: "solidpowerbattery.com",
    CRSP: "crisprtx.com",
    ACHR: "archer.com",
    OSCR: "hioscar.com",
    KSCP: "knightscope.com",
    MVIS: "microvision.com",
    HASI: "hannonarmstrong.com",
  };

  return (
    <section className="w-full min-h-screen bg-[#0b1220] text-gray-200 pt-3 pb-8 font-[Inter]">
      {/* 🔹 หัวเรื่อง */}
      <div className="flex justify-between items-center mb-3 px-4">
        <h2 className="text-[22px] font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
          🚀 ORIGINX PICKS
        </h2>
      </div>

      {/* 🔹 รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/60">
        {picks.map((r) => (
          <div
            key={r.symbol}
            className="flex items-center justify-between px-4 py-[10px] hover:bg-[#111827]/40 transition-all"
          >
            {/* ซ้าย: โลโก้ + ชื่อบริษัท */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                {!imgError[r.symbol] ? (
                  <img
                    src={`https://logo.clearbit.com/${logoMap[r.symbol]}`}
                    alt={r.symbol}
                    onError={() => setImgError((p) => ({ ...p, [r.symbol]: true }))}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-bold text-[10px] uppercase">{r.symbol}</span>
                )}
              </div>

              <div>
                <div className="text-white font-semibold text-[15px] leading-tight">{r.symbol}</div>
                <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                  {r.name}
                </div>
              </div>
            </div>

            {/* ขวา: ราคา / RSI / Buy */}
            <div className="flex flex-col items-end leading-tight pr-1">
              <span className="text-gray-100 text-[14px] font-semibold">${r.price.toFixed(2)}</span>
              <span
                className={`text-[13px] font-semibold ${
                  r.rsi > 70 ? "text-red-400" : r.rsi < 40 ? "text-blue-400" : "text-emerald-400"
                }`}
              >
                {r.rsi.toFixed(2)}
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
        ))}
      </div>
    </section>
  );
    }
