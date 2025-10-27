// ✅ /components/MarketSection.js — OriginX (Search เท่านั้น, ไม่มี Add)
import { useState, useRef, useEffect } from "react";

export default function MarketSection() {
  const [stocks, setStocks] = useState([]);
  const [data, setData] = useState([]);
  const [imgError, setImgError] = useState({});
  const [search, setSearch] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โหลดหุ้นจากหลังบ้าน (หรือจาก localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("discovery-stocks");
      if (saved) setStocks(JSON.parse(saved));
      else {
        // 🔹 default หุ้นที่ backend กำหนดไว้
        setStocks([
          "LAES", "PATH", "WULF", "AXTI", "CCCX",
          "RXRX", "SOFI", "RKLB", "LWLG", "ASTS",
          "RIVN", "SOUN", "ENVX", "SES", "BBAI",
          "SLDP", "CRSP", "ACHR", "OSCR", "KSCP", "MVIS"
        ]);
      }
    } catch {}
  }, []);

  // ✅ ดึงข้อมูลหุ้นจาก API
  const fetchStockData = async (sym) => {
    try {
      const res = await fetch(`/api/visionary-core?symbol=${sym}`, { cache: "no-store" });
      const core = await res.json();

      const price = core?.lastClose ?? 0;
      const rsi = core?.rsi ?? 50;
      const trend = core?.trend || (rsi > 55 ? "Uptrend" : rsi < 45 ? "Downtrend" : "Sideway");
      const signal = trend === "Uptrend" ? "Buy" : trend === "Downtrend" ? "Sell" : "Hold";
      const company = core?.companyName || sym;

      const item = { symbol: sym, companyName: company, lastClose: price, rsi, trend, signal };

      setData((prev) => {
        const exist = prev.find((x) => x.symbol === sym);
        return exist ? prev.map((x) => (x.symbol === sym ? item : x)) : [...prev, item];
      });
    } catch (err) {
      console.error(`❌ Fetch error ${sym}:`, err);
    }
  };

  // ✅ ดึงข้อมูลทั้งหมด (ครั้งเดียว)
  useEffect(() => {
    if (stocks.length > 0) stocks.forEach((sym) => fetchStockData(sym));
  }, [stocks]);

  // ✅ ลบหุ้นด้วยการ swipe ซ้าย
  const removeStock = (sym) => {
    const updated = stocks.filter((s) => s !== sym);
    setStocks(updated);
    localStorage.setItem("discovery-stocks", JSON.stringify(updated));
    setData((prev) => prev.filter((x) => x.symbol !== sym));
  };

  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (sym) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 70) removeStock(sym);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // ✅ กรองด้วยช่องค้นหา
  const filtered = data.filter((x) =>
    x.symbol.toLowerCase().includes(search.toLowerCase()) ||
    x.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ โลโก้หลัก
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
  };

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* 🔎 ช่องค้นหา */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[22px] font-extrabold text-white tracking-tight uppercase font-sans flex items-center gap-2">
          🚀 OriginX
        </h2>
      </div>

      <div className="px-3 mb-4">
        <input
          type="text"
          placeholder="ค้นหาหุ้น เช่น PLTR หรือ Tesla..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111827]/90 border border-gray-700 rounded-md text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
      </div>

      {/* ✅ รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {filtered?.length ? (
          filtered.map((r, i) => {
            const domain = logoMap[r.symbol] || `${r.symbol.toLowerCase()}.com`;

            return (
              <div
                key={r.symbol + i}
                className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(r.symbol)}
              >
                {/* โลโก้ + ชื่อบริษัท */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                    {imgError[r.symbol] ? (
                      <span className="text-white text-[10px] font-bold uppercase">{r.symbol}</span>
                    ) : (
                      <img
                        src={`https://logo.clearbit.com/${domain}`}
                        alt={r.symbol}
                        onError={() => setImgError((p) => ({ ...p, [r.symbol]: true }))}
                        className="w-full h-full object-cover rounded-full"
                      />
                    )}
                  </div>

                  <div>
                    <div className="text-white font-semibold text-[15px]">{r.symbol}</div>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                      {r.companyName}
                    </div>
                  </div>
                </div>

                {/* ราคา / RSI / Signal */}
                <div className="flex flex-col items-end font-mono pr-[3px] sm:pr-4 leading-tight">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {r.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[13px] font-semibold ${
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
                    className={`text-[13px] font-bold ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal || "-"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500 italic">ไม่พบหุ้นที่ตรงกับคำค้นหา</div>
        )}
      </div>
    </section>
  );
    }
