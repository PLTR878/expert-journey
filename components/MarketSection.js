// ✅ /components/MarketSection.js — OriginX (แนวตั้งขวาเหมือน TradingView Mobile)
import { useState } from "react";

export default function MarketSection() {
  const [imgError, setImgError] = useState({});

  const data = [
    { symbol: "LAES", company: "SEALSQ Corp", price: 6.71, rsi: 62.66, signal: "Buy" },
    { symbol: "PATH", company: "UiPath Inc.", price: 17.34, rsi: 60.71, signal: "Buy" },
    { symbol: "WULF", company: "TeraWulf Inc.", price: 13.63, rsi: 59.91, signal: "Buy" },
    { symbol: "AXTI", company: "AXT Inc.", price: 6.12, rsi: 58.56, signal: "Buy" },
    { symbol: "CCCX", company: "Churchill Capital Corp X", price: 22.25, rsi: 57.88, signal: "Buy" },
    { symbol: "RXRX", company: "Recursion Pharmaceuticals", price: 6.10, rsi: 57.05, signal: "Buy" },
    { symbol: "SOFI", company: "SoFi Technologies Inc.", price: 29.82, rsi: 56.70, signal: "Buy" },
    { symbol: "RKLB", company: "Rocket Lab Corp.", price: 65.01, rsi: 56.39, signal: "Buy" },
    { symbol: "LWLG", company: "Lightwave Logic Inc.", price: 4.87, rsi: 52.33, signal: "Buy" },
    { symbol: "ASTS", company: "AST SpaceMobile Inc.", price: 76.99, rsi: 51.85, signal: "Buy" },
  ];

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
  };

  return (
    <section className="w-full min-h-screen bg-[#0b1220] text-gray-200 pt-3 font-[Inter]">
      <div className="flex justify-between items-center mb-3 px-4">
        <h2 className="text-[22px] font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
          🚀 ORIGINX
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-gray-800/60 pb-6">
        {data.map((r) => (
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
                <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">{r.company}</div>
              </div>
            </div>

            {/* ขวา: ราคา / RSI / Buy แนวตั้ง */}
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
