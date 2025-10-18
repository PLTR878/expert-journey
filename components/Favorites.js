// ✅ /components/Favorites.js — Visionary Perfect Alignment Edition (V∞.10)
export default function Favorites({ data }) {
  return (
    <section className="w-full mb-4">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between mb-2 px-3">
        <h2 className="text-emerald-400 text-[15px] font-semibold tracking-wide">
          My Favorite Stocks
        </h2>
        <span className="text-[11px] text-gray-400">
          ({data?.length || 0} symbols)
        </span>
      </div>

      {/* ตารางเต็มหน้าจอ ไม่มีกรอบ */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-center border-collapse">
          <thead>
            <tr className="text-gray-400 text-[11px] uppercase select-none border-b border-white/5">
              <th className="py-2 font-medium text-left pl-4 w-[30%]">Symbol</th>
              <th className="py-2 font-medium text-right pr-6 w-[25%]">Price</th>
              <th className="py-2 font-medium text-right pr-6 w-[20%]">RSI</th>
              <th className="py-2 font-medium text-right pr-6 w-[25%]">AI Signal</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="transition-colors hover:bg-[#1a253a]/60"
                >
                  {/* Symbol */}
                  <td className="py-2.5 text-left pl-4 font-semibold text-sky-400 whitespace-nowrap">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 text-right pr-6 font-mono text-gray-100">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>

                  {/* RSI */}
                  <td
                    className={`py-2.5 text-right pr-6 font-mono ${
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
                    className={`py-2.5 text-right pr-6 font-semibold ${
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
