// ✅ MarketLikeFavorites — ใช้กับ visionary-core + visionary-discovery-pro (V∞.8)
import { useRef, useState, useEffect } from "react";

export default function MarketLikeFavorites({ mode = "discovery" }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ โหลดข้อมูลจาก API (AI Discovery Pro)
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const url =
        mode === "scanner"
          ? "/api/visionary-scanner?type=scanner"
          : "/api/visionary-discovery-pro";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const j = await res.json();

      const arr =
        j.discovered ||
        j.stocks ||
        j.results ||
        j.data ||
        j.list ||
        [];

      if (!Array.isArray(arr) || arr.length === 0)
        throw new Error("ไม่พบข้อมูลหุ้นจาก AI");

      const formatted = arr.map((r) => ({
        symbol: r.symbol,
        name: r.name || r.company || "Unknown Company",
        price: r.price || r.lastClose || 0,
        aiScore: r.aiScore || 0,
        reason: r.reason || "AI พบศักยภาพในอนาคต",
        signal:
          r.aiScore > 85
            ? "Buy"
            : r.aiScore < 75
            ? "Sell"
            : "Hold",
      }));

      setList(formatted);
      console.log(`✅ Loaded ${formatted.length} หุ้นจากโหมด: ${mode}`);
    } catch (err) {
      console.error("⚠️ Error loading data:", err);
      setList([]);
      setErrorMsg(err.message || "โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // ✅ โหลดตอนเปิดหน้า
  useEffect(() => {
    fetchMarketData();
  }, [mode]);

  // ✅ รีโหลดใหม่
  const handleReload = async () => {
    await fetchMarketData();
  };

  const title =
    mode === "scanner"
      ? "📡 สแกนหุ้นทั้งตลาด (AI Market Scanner)"
      : "🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)";

  return (
    <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400">{title}</h2>

        <button
          onClick={handleReload}
          className={`text-[12px] px-2 py-[3px] rounded-md border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 transition-all ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* แสดงจำนวนหุ้น */}
      <div className="text-[12px] text-gray-400 px-[4px] mb-2">
        {list?.length
          ? `พบหุ้นทั้งหมด ${list.length} ตัว`
          : loading
          ? "กำลังโหลดข้อมูล..."
          : errorMsg
          ? `⚠️ ${errorMsg}`
          : "ไม่มีข้อมูลตลาด"}
      </div>

      {/* Layout */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {list?.length ? (
          list.map((r, i) => (
            <a
              key={r.symbol + i}
              href={`/analyze/${r.symbol}`}
              className="flex items-center justify-between py-[10px] px-[6px] hover:bg-[#111827]/50 transition-all rounded-md"
            >
              <div>
                <div className="text-white font-semibold text-[15px]">
                  {r.symbol}
                </div>
                <div className="text-[11px] text-gray-400">{r.name}</div>
                <div className="text-[10px] text-emerald-400 truncate max-w-[180px] mt-[2px]">
                  📈 {r.reason}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[13px]">
                  ${Number(r.price).toFixed(2)}
                </div>
                <div
                  className={`text-[12px] font-bold ${
                    r.signal === "Buy"
                      ? "text-green-400"
                      : r.signal === "Sell"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {r.signal}
                </div>
                <div className="text-[10px] text-gray-500">
                  AI {Math.round(r.aiScore)}%
                </div>
              </div>
            </a>
          ))
        ) : (
          !loading && (
            <div className="py-6 text-center text-gray-500 italic">
              {errorMsg || "No market data available."}
            </div>
          )
        )}
      </div>
    </section>
  );
}
