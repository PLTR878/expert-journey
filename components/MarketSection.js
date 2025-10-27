// ✅ /components/MarketSection.js — OriginX Picks (TradingView Style)
import { useEffect, useState } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);

  const symbols = [
    "WULF","DNA","BYND","OSCR","BBAI","ACHR","PATH","MVIS","SES","KSCP",
    "CCCX","RKLB","ASTS","CRSP","SLDP","ENVX","SOFI","HASI","LWLG","SOUN",
    "AXTI","LAES","RXRX","NRGV","RIVN"
  ];

  const logoMap = {
    WULF:"terawulf.com", DNA:"ginkgobioworks.com", BYND:"beyondmeat.com",
    OSCR:"hioscar.com", BBAI:"bigbear.ai", ACHR:"archer.com", PATH:"uipath.com",
    MVIS:"microvision.com", SES:"ses.ai", KSCP:"knightscope.com", CCCX:"churchillcapitalcorp.com",
    RKLB:"rocketlabusa.com", ASTS:"ast-science.com", CRSP:"crisprtx.com", SLDP:"solidpowerbattery.com",
    ENVX:"enovix.com", SOFI:"sofi.com", HASI:"hannonarmstrong.com", LWLG:"lightwavelogic.com",
    SOUN:"soundhound.com", AXTI:"axt.com", LAES:"sealsq.com", RXRX:"recursion.com",
    NRGV:"energyvault.com", RIVN:"rivian.com"
  };

  const companyMap = {
    WULF:"TeraWulf Inc.", DNA:"Ginkgo Bioworks Holdings Inc.", BYND:"Beyond Meat Inc.",
    OSCR:"Oscar Health Inc.", BBAI:"BigBear.ai Holdings Inc.", ACHR:"Archer Aviation Inc.",
    PATH:"UiPath Inc.", MVIS:"MicroVision Inc.", SES:"SES AI Corporation",
    KSCP:"Knightscope Inc.", CCCX:"Churchill Capital Corp X", RKLB:"Rocket Lab USA Inc.",
    ASTS:"AST SpaceMobile Inc.", CRSP:"CRISPR Therapeutics AG", SLDP:"Solid Power Inc.",
    ENVX:"Enovix Corporation", SOFI:"SoFi Technologies Inc.",
    HASI:"Hannon Armstrong Sustainable Infrastructure Capital Inc.",
    LWLG:"Lightwave Logic Inc.", SOUN:"SoundHound AI Inc.",
    AXTI:"AXT Inc.", LAES:"SEALSQ Corp", RXRX:"Recursion Pharmaceuticals Inc.",
    NRGV:"Energy Vault Holdings Inc.", RIVN:"Rivian Automotive Inc."
  };

  async function loadAll() {
    const results = [];
    for (const sym of symbols) {
      try {
        const res = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
        const json = await res.json();

        const price = json?.lastClose ?? 0;
        const prev = json?.previousClose ?? price;
        const diff = price - prev;
        const change = ((diff / prev) * 100).toFixed(2);

        results.push({
          symbol: sym,
          company: companyMap[sym],
          price,
          diff,
          change,
        });
      } catch (err) {
        console.warn("Error:", sym, err);
      }
    }
    setData(results);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000); // ⏱ refresh ทุก 1 นาที
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full bg-[#0b1220] min-h-screen text-gray-100 px-2 pt-3 font-sans">
      <h2 className="text-[22px] font-extrabold text-white flex items-center gap-2 mb-4">
        🚀 OriginX Picks
      </h2>

      {data.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">⏳ Loading...</div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {data.map((r, i) => {
            const domain = logoMap[r.symbol];
            const isUp = r.diff > 0;
            const diffText = `${isUp ? "+" : ""}${r.diff.toFixed(2)}`;
            const pctText = `${isUp ? "+" : ""}${r.change}%`;

            return (
              <a
                key={i}
                href={`/analyze/${r.symbol}`}
                className="flex items-center justify-between py-[10px] px-1 hover:bg-[#111827]/60 transition-all"
              >
                {/* โลโก้ + ชื่อหุ้น */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-700 flex items-center justify-center bg-[#0d111a]">
                    <img
                      src={`https://logo.clearbit.com/${domain}`}
                      alt={r.symbol}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.target.src = `https://placehold.co/48x48/0b1220/FFF?text=${r.symbol}`)
                      }
                    />
                  </div>
                  <div>
                    <div className="text-white text-[15px] font-black tracking-wide leading-tight">
                      {r.symbol}
                    </div>
                    <div className="text-gray-400 text-[11px] font-medium truncate max-w-[180px] leading-snug">
                      {r.company}
                    </div>
                  </div>
                </div>

                {/* ราคา + เปลี่ยนแปลง */}
                <div className="text-right leading-tight font-mono min-w-[80px] pr-[2px]">
                  <div className="text-[15px] text-white font-extrabold">
                    ${r.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-[13px] font-bold ${
                      isUp ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {diffText} ({pctText})
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
        }
