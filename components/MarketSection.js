// ✅ /components/MarketSection.js — OriginX (Static Version, No Search, Like Favorites)
import { useState, useEffect } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);
  const [imgError, setImgError] = useState({});

  // ✅ หุ้นเริ่มต้น (static list)
  const stocks = [
    "LAES", "PATH", "WULF", "AXTI", "CCCX", "RXRX", "SOFI",
    "RKLB", "LWLG", "ASTS", "RIVN", "SOUN", "ENVX", "BYND",
    "NRGV", "SES", "BBAI", "SLDP", "DNA", "CRSP", "ACHR",
    "OSCR", "KSCP", "MVIS", "HASI"
  ];

  // ✅ ข้อมูลแบบคงที่
  const staticData = {
    LAES: { price: 6.71, rsi: 62.66, signal: "Buy", company: "SEALSQ Corp" },
    PATH: { price: 17.34, rsi: 60.71, signal: "Buy", company: "UiPath Inc." },
    WULF: { price: 13.63, rsi: 59.91, signal: "Buy", company: "TeraWulf Inc." },
    AXTI: { price: 6.12, rsi: 58.56, signal: "Buy", company: "AXT Inc." },
    CCCX: { price: 22.25, rsi: 57.88, signal: "Buy", company: "Churchill Capital Corp X" },
    RXRX: { price: 6.10, rsi: 57.05, signal: "Buy", company: "Recursion Pharmaceuticals" },
    SOFI: { price: 29.82, rsi: 56.70, signal: "Buy", company: "SoFi Technologies Inc." },
    RKLB: { price: 65.01, rsi: 56.39, signal: "Buy", company: "Rocket Lab Corp." },
    LWLG: { price: 4.87, rsi: 52.33, signal: "Buy", company: "Lightwave Logic Inc." },
    ASTS: { price: 76.99, rsi: 51.85, signal: "Buy", company: "AST SpaceMobile Inc." },
    RIVN: { price: 13.35, rsi: 51.70, signal: "Sell", company: "Rivian Automotive Inc." },
    SOUN: { price: 18.37, rsi: 50.77, signal: "Buy", company: "SoundHound AI Inc." },
    ENVX: { price: 12.33, rsi: 49.46, signal: "Buy", company: "Enovix Corp." },
    BYND: { price: 3.26, rsi: 48.05, signal: "Sell", company: "Beyond Meat Inc." },
    NRGV: { price: 3.21, rsi: 48.47, signal: "Hold", company: "Energy Vault Holdings" },
    SES: { price: 2.45, rsi: 45.68, signal: "Hold", company: "SES AI Corp." },
    BBAI: { price: 6.97, rsi: 45.49, signal: "Hold", company: "BigBear.ai Holdings" },
    SLDP: { price: 5.78, rsi: 44.72, signal: "Buy", company: "Solid Power Inc." },
    DNA: { price: 13.30, rsi: 43.53, signal: "Hold", company: "Ginkgo Bioworks Holdings" },
    CRSP: { price: 65.40, rsi: 43.11, signal: "Hold", company: "CRISPR Therapeutics AG" },
    ACHR: { price: 11.43, rsi: 41.48, signal: "Buy", company: "Archer Aviation Inc." },
    OSCR: { price: 19.52, rsi: 38.44, signal: "Hold", company: "Oscar Health Inc." },
    KSCP: { price: 5.72, rsi: 35.68, signal: "Sell", company: "Knightscope Inc." },
    MVIS: { price: 1.23, rsi: 35.34, signal: "Hold", company: "MicroVision Inc." },
    HASI: { price: 28.65, rsi: 34.16, signal: "Hold", company: "Hannon Armstrong Sustainable Infra." },
  };

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

  useEffect(() => {
    const result = stocks.map((sym) => ({
      symbol: sym,
      ...staticData[sym],
    }));
    setData(result);
  }, []);

  return (
    <section className="w-full min-h-screen bg-[#0b1220] text-gray-200 pt-3 font-[Inter]">
      <div className="flex justify-between items-center mb-3 px-3">
        <h2 className="text-[22px] font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
          🚀 OriginX
        </h2>
      </div>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/60 px-2 pb-6">
        {data.map((r) => (
          <div
            key={r.symbol}
            className="flex items-center justify-between py-[12px] hover:bg-[#111827]/40 rounded-lg transition-all"
          >
            {/* ซ้าย */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden relative">
                {!imgError[r.symbol] ? (
                  <img
                    src={`https://logo.clearbit.com/${logoMap[r.symbol]}`}
                    alt={r.symbol}
                    onError={() => setImgError((p) => ({ ...p, [r.symbol]: true }))}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-extrabold text-[10px] uppercase tracking-tight">
                    {r.symbol}
                  </span>
                )}
              </div>
              <div>
                <div className="text-white font-semibold text-[14px] leading-tight">{r.symbol}</div>
                <div className="text-[11px] text-gray-400 font-medium truncate max-w-[160px]">
                  {r.company}
                </div>
              </div>
            </div>

            {/* ขวา */}
            <div className="flex items-center gap-3 font-mono pr-[3px]">
              <span className="text-gray-100 text-[14px] font-semibold">${r.price.toFixed(2)}</span>
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
