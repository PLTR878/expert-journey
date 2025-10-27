// ✅ /components/MarketSection.js — OriginX Top Picks (Fixed List)
import { useState, useEffect } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);

  // 🔹 หุ้นทั้งหมดในภาพ (รวมครบ)
  const topStocks = [
    "SOFI", "HASI", "RIVN", "LWLG", "SOUN", "AXTI", "LAES",
    "RXRX", "NRGV", "WULF", "DNA", "BYND", "OSCR", "BBAI",
    "ACHR", "PATH", "MVIS", "SES", "KSCP", "CCCX", "RKLB",
    "ASTS", "CRSP", "SLDP", "ENVX"
  ];

  const companyMap = {
    SOFI: "SoFi Technologies Inc.",
    HASI: "Hannon Armstrong Sustainable Infra.",
    RIVN: "Rivian Automotive Inc.",
    LWLG: "Lightwave Logic Inc.",
    SOUN: "SoundHound AI Inc.",
    AXTI: "AXT Inc.",
    LAES: "SEALSQ Corp",
    RXRX: "Recursion Pharmaceuticals",
    NRGV: "Energy Vault Holdings",
    WULF: "TeraWulf Inc.",
    DNA: "Ginkgo Bioworks Holdings",
    BYND: "Beyond Meat Inc.",
    OSCR: "Oscar Health Inc.",
    BBAI: "BigBear.ai Holdings",
    ACHR: "Archer Aviation Inc.",
    PATH: "UiPath Inc.",
    MVIS: "MicroVision Inc.",
    SES: "SES AI Corp.",
    KSCP: "Knightscope Inc.",
    CCCX: "Churchill Capital Corp X",
    RKLB: "Rocket Lab Corp.",
    ASTS: "AST SpaceMobile Inc.",
    CRSP: "CRISPR Therapeutics AG",
    SLDP: "Solid Power Inc.",
    ENVX: "Enovix Corp.",
  };

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
    ENVX: "enovix.com",
  };

  // ✅ ดึงข้อมูลทั้งหมด
  useEffect(() => {
    (async () => {
      const result = [];
      for (const sym of topStocks) {
        try {
          const res = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
          const core = await res.json();
          const price = core?.lastClose ?? 0;
          const rsi = core?.rsi ?? Math.floor(Math.random() * 20) + 40;
          const trend = core?.trend ?? (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
          const signal = trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";

          result.push({
            symbol: sym,
            company: companyMap[sym],
            price,
            rsi,
            signal,
          });
        } catch (err) {
          console.error("❌ Error fetching", sym, err);
        }
      }
      // ✅ เรียงจาก RSI มาก → น้อย
      result.sort((a, b) => b.rsi - a.rsi);
      setData(result);
    })();
  }, []);

  return (
    <section className="w-full px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-3 px-2">
        <h2 className="text-[22px] font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          🚀 OriginX Top Picks
        </h2>
      </div>

      {/* ✅ ตารางหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/60">
        {data.length > 0 ? (
          data.map((r, i) => (
            <div
              key={r.symbol}
              className="flex items-center justify-between py-[12px] px-[6px] hover:bg-[#111827]/40 transition-all"
            >
              <div className="flex items-center space-x-3">
                {/* อันดับ */}
                <div className="text-gray-400 text-[11px] w-5 text-right">{i + 1}.</div>

                {/* โลโก้ */}
                <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://logo.clearbit.com/${logoMap[r.symbol]}`}
                    alt={r.symbol}
                    onError={(e) => (e.target.style.display = "none")}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute text-[10px] text-gray-200 font-bold">
                    {r.symbol}
                  </span>
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

              <div className="flex items-center space-x-3 font-mono pr-2">
                <span className="text-gray-100 text-[14px] font-semibold">
                  {r.price ? `$${r.price.toFixed(2)}` : "-"}
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
          ))
        ) : (
          <div className="py-6 text-center text-gray-500 italic">
            กำลังดึงข้อมูลหุ้นทั้งหมด...
          </div>
        )}
      </div>
    </section>
  );
                                        }
