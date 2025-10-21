// ✅ /components/Favorites.js — Stable Original UI (V∞.27)
export default function Favorites({
  data = [],
  favorites = [],
  setFavorites = () => {},
  fetchPrice = () => {},
}) {
  const removeFavorite = (sym) =>
    setFavorites((prev) => prev.filter((x) => x !== sym));

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4 shadow-xl mt-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-emerald-400">
          💙 หุ้นที่คุณติดตาม (Favorites)
        </h2>
        <span className="text-[12px] text-gray-400">
          {data.length ? `${data.length} ตัว` : "ไม่มีรายการ"}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8 italic">
          ยังไม่มีรายการโปรด
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {data.map((r, i) => (
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
                <div className="text-[11px] text-gray-400">
                  {r.reason || "—"}
                </div>
              </div>

              {/* ฝั่งขวา */}
              <div className="text-right font-mono">
                <div className="text-[13px]">
                  {r.price ? `$${r.price.toFixed(2)}` : "—"}
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
                  {r.signal || "Hold"}
                </div>
                <div className="text-[10px] text-gray-500">
                  RSI {Math.round(r.rsi || 0)}
                </div>
              </div>

              {/* ปุ่มลบ */}
              <button
                onClick={() => removeFavorite(r.symbol)}
                className="ml-3 text-gray-500 hover:text-red-400 text-[15px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
                  }
