// ✅ /components/Favorites.js — Visionary Ultra Clean Edition (V∞.8)
export default function Favorites({ data }) {
  return (
    <section className="p-2 mb-4">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-emerald-400 text-[15px] font-semibold tracking-wide">
          My Favorite Stocks
        </h2>
        <span className="text-[11px] text-gray-400">
          ({data?.length || 0} symbols)
        </span>
      </div>

      {/* ตารางแบบเรียบ ไม่มีกรอบ */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-center border-collapse">
          {/* หัวตาราง */}
          <thead>
            <tr className="text-gray-400 text-[11px] uppercase select-none border-b border-white/10">
              <th className="py-2 font-medium">Symbol</th>
              <th className="py-2 font-medium">Price</th>
              <th className="py-2 font-medium">RSI</th>
              <th className="py-2 font-medium">AI Signal</th>
            </tr>
          </thead>

          {/* เนื้อหา */}
          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className={`transition-all hover:bg-[#162035]/80`}
                >
                  {/* Symbol */}
                  <td className="py-2.5 text-center font-semibold text-sky-400">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 text-center font-mono text-gray-100">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>

                  {/* RSI */}
                  <td
                    className={`py-2.5 text-center font-mono ${
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
                  </td>

                  {/* AI Signal */}
                  <td
                    className={`py-2.5 text-center font-semibold ${
                      r.signal === "Buy"
                        ? "text-green-400"
                        : r.signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {r.signal || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-4 text-gray-500 text-center italic"
                >
                  No favorites yet. Add one by searching 🔍
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
          }
