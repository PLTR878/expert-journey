// ✅ /components/MarketSection.js — OriginX Picks (Fixed Version)
import { useEffect, useState } from "react";

export default function MarketSection() {
  const [data, setData] = useState([]);

  // ✅ รายชื่อหุ้นที่พี่คัดเอง (25 ตัว)
  const symbols = [
    "LAES", "PATH", "WULF", "AXTI", "CCCX", "RXRX", "SOFI", "RKLB", "LWLG",
    "ASTS", "BBAI", "SLDP", "CRSP", "ACHR", "OSCR", "KSCP", "MVIS", "HASI",
    "IREN", "GWH", "AEHR", "PLTR", "NRGV", "ENVX", "SES"
  ];

  // ✅ แผนที่โลโก้ (แก้ให้ถูก domain)
  const logoMap = {
    LAES: "sealsq.com",
    PATH: "uipath.com",
    WULF: "terawulf.com",
    AXTI: "axt.com",
    CCCX: "churchillcapitalcorp.com",
    RXRX: "recursion.com",
    SOFI: "sofi.com",
    RKLB: "rocketlabusa.com",
    LWLG: "lightwavelogic.com",
    ASTS: "ast-science.com",
    BBAI: "bigbear.ai",
    SLDP: "solidpowerbattery.com",
    CRSP: "crisprtx.com",
    ACHR: "archer.com",
    OSCR: "hioscar.com",
    KSCP: "knightscope.com",
    MVIS: "microvision.com",
    HASI: "hannonarmstrong.com",
    IREN: "irisenergy.co",
    GWH: "esstech.com",
    AEHR: "aehr.com",
    PLTR: "palantir.com",
    NRGV: "energyvault.com",
    ENVX: "enovix.com",
    SES: "ses.ai",
  };

  // ✅ ดึงข้อมูลจาก API
  useEffect(() => {
    async function loadAll() {
      const results = [];
      for (const sym of symbols) {
        try {
          const res = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
          const json = await res.json();

          const price = json?.lastClose ?? 0;
          const rsi = json?.rsi ?? 50;
          const trend = json?.trend ?? (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
          const signal = trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";
          const company = json?.companyName || sym;

          results.push({ symbol: sym, price, rsi, signal, company });
        } catch (err) {
          console.warn("Fetch fail", sym, err);
        }
      }
      setData(results);
    }
    loadAll();
  }, []);

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      <h2 className="text-[22px] font-extrabold text-white tracking-tight uppercase font-sans flex items-center gap-2 mb-4">
        🚀 OriginX Picks
      </h2>

      <div className="flex flex-col divide-y divide-gray-800/50">
        {data.length > 0 ? (
          data.map((r, i) => (
            <a
              key={r.symbol + i}
              href={`/analyze/${r.symbol}`}
              className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://logo.clearbit.com/${logoMap[r.symbol]}`}
                    alt={r.symbol}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/48x48/0b1220/FFF?text=${r.symbol}`;
                    }}
                  />
                </div>
                <div>
                  <div className="text-white font-semibold text-[15px]">{r.symbol}</div>
                  <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                    {r.company}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end font-mono pr-[3px] sm:pr-4 leading-tight">
                <span className="text-gray-100 text-[14px] font-semibold">
                  ${r.price.toFixed(2)}
                </span>
                <span
                  className={`text-[13px] font-semibold ${
                    r.rsi > 70
                      ? "text-red-400"
                      : r.rsi < 40
                      ? "text-blue-400"
                      : "text-emerald-400"
                  }`}
                >
                  {Math.round(r.rsi)}
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
            </a>
          ))
        ) : (
          <div className="py-10 text-center text-gray-500 italic">⏳ Loading OriginX Picks...</div>
        )}
      </div>
    </section>
  );
            }
