import { useState } from "react";

export default function OriginXSection() {
  const [imgError, setImgError] = useState({});

  // ✅ หุ้นที่อยากให้แสดงทันที
  const stocks = [
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
    { symbol: "IREN", name: "Iris Energy Ltd", price: 64.41, rsi: 53, signal: "Buy" },
    { symbol: "BBAI", name: "BigBear.ai Holdings", price: 7.08, rsi: 46, signal: "Hold" },
    { symbol: "GWH", name: "ESS Tech Inc", price: 5.00, rsi: 60, signal: "Buy" },
    { symbol: "PLUG", name: "Plug Power Inc", price: 2.95, rsi: 32, signal: "Hold" },
    { symbol: "NVDA", name: "NVIDIA Corp", price: 191.36, rsi: 57, signal: "Buy" },
    { symbol: "AEHR", name: "Aehr Test Systems", price: 12.50, rsi: 55, signal: "Buy" },
    { symbol: "NRGV", name: "Energy Vault Holdings", price: 3.19, rsi: 48, signal: "Hold" },
    { symbol: "CRSP", name: "CRISPR Therapeutics AG", price: 65.14, rsi: 42, signal: "Hold" },
    { symbol: "ACHR", name: "Archer Aviation Inc", price: 11.38, rsi: 41, signal: "Buy" },
    { symbol: "MVIS", name: "MicroVision Inc", price: 1.23, rsi: 35, signal: "Hold" },
    { symbol: "KSCP", name: "Knightscope Inc", price: 5.69, rsi: 35, signal: "Sell" },
    { symbol: "SLDP", name: "Solid Power Inc", price: 5.74, rsi: 44, signal: "Buy" },
    { symbol: "SES", name: "SES AI Corp", price: 2.44, rsi: 45, signal: "Hold" },
    { symbol: "OSCR", name: "Oscar Health Inc", price: 19.45, rsi: 38, signal: "Hold" },
    { symbol: "HASI", name: "Hannon Armstrong", price: 28.65, rsi: 34, signal: "Hold" },
  ];

  // ✅ โลโก้จริง
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

  return (
    <section className="w-full min-h-screen bg-[#0b1220] text-gray-200 pt-3 pb-8 font-[Inter]">
      <div className="flex justify-between items-center mb-3 px-4">
        <h2 className="text-[22px] font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          🚀 OriginX Picks
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-gray-800/60">
        {stocks.map((r) => (
          <div
            key={r.symbol}
            className="flex items-center justify-between px-4 py-[10px] hover:bg-[#111827]/40 transition-all"
          >
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
                <a
                  href={`/analyze/${r.symbol}`}
                  className="text-white hover:text-emerald-400 font-semibold text-[15px]"
                >
                  {r.symbol}
                </a>
                <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                  {r.name}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end leading-tight pr-1">
              <span className="text-gray-100 text-[14px] font-semibold">${r.price}</span>
              <span
                className={`text-[13px] font-semibold ${
                  r.rsi > 70 ? "text-red-400" : r.rsi < 40 ? "text-blue-400" : "text-emerald-400"
                }`}
              >
                {r.rsi}
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
