// ✅ /components/MarketSection.js — OriginX Top Picks (Static, Perfect Alignment)
import { useState } from "react";

export default function MarketSection() {
  const [data] = useState([
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
    { symbol: "RIVN", company: "Rivian Automotive Inc.", price: 13.35, rsi: 51.70, signal: "Sell" },
    { symbol: "SOUN", company: "SoundHound AI Inc.", price: 18.37, rsi: 50.77, signal: "Buy" },
    { symbol: "ENVX", company: "Enovix Corp.", price: 12.33, rsi: 49.46, signal: "Buy" },
    { symbol: "BYND", company: "Beyond Meat Inc.", price: 3.26, rsi: 48.05, signal: "Sell" },
    { symbol: "NRGV", company: "Energy Vault Holdings", price: 3.21, rsi: 48.47, signal: "Hold" },
    { symbol: "SES", company: "SES AI Corp.", price: 2.45, rsi: 45.68, signal: "Hold" },
    { symbol: "BBAI", company: "BigBear.ai Holdings", price: 6.97, rsi: 45.49, signal: "Hold" },
    { symbol: "SLDP", company: "Solid Power Inc.", price: 5.78, rsi: 44.72, signal: "Buy" },
    { symbol: "DNA", company: "Ginkgo Bioworks Holdings", price: 13.30, rsi: 43.53, signal: "Hold" },
    { symbol: "CRSP", company: "CRISPR Therapeutics AG", price: 65.40, rsi: 43.11, signal: "Hold" },
    { symbol: "ACHR", company: "Archer Aviation Inc.", price: 11.43, rsi: 41.48, signal: "Buy" },
    { symbol: "OSCR", company: "Oscar Health Inc.", price: 19.52, rsi: 38.44, signal: "Hold" },
    { symbol: "KSCP", company: "Knightscope Inc.", price: 5.72, rsi: 35.68, signal: "Sell" },
    { symbol: "MVIS", company: "MicroVision Inc.", price: 1.23, rsi: 35.34, signal: "Hold" },
    { symbol: "HASI", company: "Hannon Armstrong Sustainable Infra.", price: 28.65, rsi: 34.16, signal: "Hold" },
  ]);

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
    BYND: "beyondmeat.com",
    NRGV: "energyvault.com",
    SES: "ses.ai",
    BBAI: "bigbear.ai",
    SLDP: "solidpowerbattery.com",
    DNA: "ginkgobioworks.com",
    CRSP: "crisprtx.com",
    ACHR: "archer.com",
    OSCR: "oscarhealth.com",
    KSCP: "knightscope.com",
    MVIS: "microvision.com",
    HASI: "hannonarmstrong.com",
  };

  return (
    <section className="w-full min-h-screen bg-[#0b1220] text-gray-200 pt-3 font-[Inter]">
      <div className="flex justify-between items-center mb-3 px-3">
        <h2 className="text-[22px] font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
          🚀 OriginX Top Picks
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-gray-800/60 px-2 pb-6">
        {data.map((r) => (
          <div
            key={r.symbol}
            className="flex items-center justify-between py-[12px] hover:bg-[#111827]/40 rounded-lg transition-all"
          >
            {/* ซ้าย */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                <img
                  src={`https://logo.clearbit.com/${logoMap[r.symbol]}`}
                  alt={r.symbol}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => (e.target.style.display = "none")}
                />
                <span className="absolute text-white font-bold text-[10px] uppercase tracking-tight">
                  {r.symbol}
                </span>
              </div>

              <div>
                <div className="text-white font-semibold text-[14px] leading-tight">
                  {r.symbol}
                </div>
                <div className="text-[11px] text-gray-400 font-medium truncate max-w-[160px]">
                  {r.company}
                </div>
              </div>
            </div>

            {/* ขวา */}
            <div className="flex items-center gap-3 font-mono pr-[3px]">
              <span className="text-gray-100 text-[14px] font-semibold">
                ${r.price.toFixed(2)}
              </span>
              <span
                className={`text-[14px] font-semibold ${
                  r.rsi > 70
                    ? "text-red-400"
                    : r.rsi < 40
                    ? "text-blue-400"
                    : "text-emerald-400"
                }`}
              >
                {r.rsi}
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
                {r.signal}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
     }
