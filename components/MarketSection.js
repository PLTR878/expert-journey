// ✅ /components/MarketSection.js — Stable Original UI (V∞.27)
export default function MarketSection({
  title = "🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)",
  rows = [],
  favorites = [],
  toggleFavorite = () => {},
  loading = false,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4 shadow-xl mt-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-emerald-400">{title}</h2>
        <span className="text-[12px] text-gray-400">
          {rows.length ? `พบหุ้นทั้งหมด ${rows.length} ตัว` : "—"}
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 animate-pulse">
          ⏳ กำลังโหลดข้อมูลจาก AI ...
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-gray-500 italic">
          ไม่มีข้อมูลตลาด
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {rows.map((r, i) => (
            <div
              key={r.symbol + i}
              className="flex justify-between items-center py-[10px] px-[6px] hover:bg-[#111827]/50 transition-all rounded-md"
            >
              {/* ฝั่งซ้าย */}
              <div>
                <a
                  href={`/analyze/${r.symbol}`}
                  className="text-white font-semibold text-[15px] hover:text-emerald-400 transition"
                >
                  {r.symbol}
                </a>
                <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                  {r.reason || "AI วิเคราะห์ศักยภาพในอนาคต"}
                </div>
              </div>

              {/* ฝั่งขวา */}
              <div className="text-right font-mono">
                <div className="text-[13px]">${r.price?.toFixed(2)}</div>
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
                  RSI {Math.round(r.rsi || 0)}
                </div>
              </div>

              {/* ปุ่ม Favorite */}
              <button
                onClick={() => toggleFavorite(r.symbol)}
                className={`ml-3 text-[16px] ${
                  favorites.includes(r.symbol)
                    ? "text-yellow-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                ★
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
                    }
