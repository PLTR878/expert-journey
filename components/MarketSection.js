// ✅ /components/MarketSection.js — OriginX Picks (Full Company Name Added)
import { useEffect, useState } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);

  // ✅ หุ้นทั้งหมด 25 ตัว (มี RIVN แทน PLTR)
  const symbols = [
    "WULF","DNA","BYND","OSCR","BBAI","ACHR","PATH","MVIS","SES","KSCP",
    "CCCX","RKLB","ASTS","CRSP","SLDP","ENVX","SOFI","HASI","LWLG","SOUN",
    "AXTI","LAES","RXRX","NRGV","RIVN"
  ];

  // ✅ แผนที่โลโก้
  const logoMap = {
    WULF:"terawulf.com",
    DNA:"ginkgobioworks.com",
    BYND:"beyondmeat.com",
    OSCR:"hioscar.com",
    BBAI:"bigbear.ai",
    ACHR:"archer.com",
    PATH:"uipath.com",
    MVIS:"microvision.com",
    SES:"ses.ai",
    KSCP:"knightscope.com",
    CCCX:"churchillcapitalcorp.com",
    RKLB:"rocketlabusa.com",
    ASTS:"ast-science.com",
    CRSP:"crisprtx.com",
    SLDP:"solidpowerbattery.com",
    ENVX:"enovix.com",
    SOFI:"sofi.com",
    HASI:"hannonarmstrong.com",
    LWLG:"lightwavelogic.com",
    SOUN:"soundhound.com",
    AXTI:"axt.com",
    LAES:"sealsq.com",
    RXRX:"recursion.com",
    NRGV:"energyvault.com",
    RIVN:"rivian.com"
  };

  useEffect(() => {
    async function loadAll() {
      const results = [];
      for (const sym of symbols) {
        try {
          const res = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
          const json = await res.json();
          const price = json?.lastClose ?? 0;
          const rsi = json?.rsi ?? 50;
          const signal = rsi > 55 ? "Buy" : rsi < 45 ? "Sell" : "Hold";
          const company = json?.companyName || sym;
          results.push({ symbol: sym, company, price, rsi, signal });
        } catch (err) {
          console.warn("Error:", sym, err);
        }
      }
      setData(results);
    }
    loadAll();
  }, []);

  return (
    <section className="w-full bg-[#0b1220] min-h-screen text-gray-100 px-2 pt-3">
      <h2 className="text-[22px] font-extrabold text-white flex items-center gap-2 mb-4">
        🚀 OriginX Picks
      </h2>

      {data.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">⏳ Loading data...</div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {data.map((r, i) => (
            <a
              key={i}
              href={`/analyze/${r.symbol}`}
              className="flex items-center justify-between py-[10px] px-1 hover:bg-[#111827]/60 transition-all"
            >
              {/* โลโก้ + ชื่อหุ้น */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-700 flex items-center justify-center bg-[#0d111a]">
                  <img
                    src={`https://logo.clearbit.com/${logoMap[r.symbol]}`}
                    alt={r.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/48x48/0b1220/FFF?text=${r.symbol}`;
                    }}
                  />
                </div>
                <div>
                  <div className="text-white text-[16px] font-black tracking-wide leading-tight">
                    {r.symbol}
                  </div>
                  <div className="text-gray-400 text-[11px] font-medium truncate max-w-[160px] leading-snug">
                    {r.company}
                  </div>
                </div>
              </div>

              {/* ราคา + RSI + สัญญาณ */}
              <div className="text-right pr-3 leading-tight font-mono">
                <div className="text-[15px] text-white font-extrabold">${r.price.toFixed(2)}</div>
                <div
                  className={`text-[13px] font-bold ${
                    r.rsi > 70
                      ? "text-red-400"
                      : r.rsi < 40
                      ? "text-blue-400"
                      : "text-emerald-400"
                  }`}
                >
                  {Math.round(r.rsi)}
                </div>
                <div
                  className={`text-[13px] font-extrabold ${
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
            </a>
          ))}
        </div>
      )}
    </section>
  );
        }
