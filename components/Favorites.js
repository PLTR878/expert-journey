// ✅ /components/Favorites.js — Visionary Ultra Balanced Edition (V∞.9)
export default function Favorites({ data }) {
  return (
    <section className="px-2 mb-6">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-emerald-400 text-[15px] font-semibold tracking-wide">
          My Favorite Stocks
        </h2>
        <span className="text-[11px] text-gray-400">
          ({data?.length || 0} symbols)
        </span>
      </div>

      {/* ตารางแบบโปร */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-center border-separate border-spacing-y-[3px]">
          <thead>
            <tr className="text-gray-400 text-[11px] uppercase select-none">
              <th className="pb-2 font-medium w-[25%]">Symbol</th>
              <th className="pb-2 font-medium w-[25%]">Price</th>
              <th className="pb-2 font-medium w-[25%]">RSI</th>
              <th className="pb-2 font-medium w-[25%]">AI Signal</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="transition-all rounded-lg"
                  style={{
                    backgroundColor: i % 2 === 0 ? "rgba(18,25,39,0.55)" : "rgba(20,30,50,0.45)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Symbol */}
                  <td className="py-2 text-center font-semibold text-sky-400 align-middle">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>

                  {/* Price */}
                  <td className="py-2 text-center font-mono text-gray-100 align-middle">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>

                  {/* RSI */}
                  <td
                    className={`py-2 text-center font-mono align-middle ${
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
                    className={`py-2 text-center font-semibold align-middle ${
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
