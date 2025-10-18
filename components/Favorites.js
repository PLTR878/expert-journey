// ✅ /components/Favorites.js — Visionary Minimal Balanced Edition (V∞.5)
export default function Favorites({ data }) {
  return (
    <section className="bg-transparent p-2 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-emerald-400 text-base font-semibold flex items-center gap-2">
          💙 My Favorite Stocks
        </h2>
        <span className="text-[11px] text-gray-400">
          ({data?.length || 0} symbols)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center border-collapse">
          <thead className="text-gray-400 text-[11px] uppercase tracking-wide border-b border-white/10">
            <tr>
              <th className="py-2 font-medium w-[25%]">Symbol</th>
              <th className="py-2 font-medium w-[25%]">Price</th>
              <th className="py-2 font-medium w-[25%]">RSI</th>
              <th className="py-2 font-medium w-[25%]">AI Signal</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className={`transition-all ${
                    i % 2 === 0 ? "bg-[#0f172a]/60" : "bg-[#111c2d]/60"
                  } hover:bg-[#1b2536]/70`}
                >
                  {/* Symbol */}
                  <td className="py-2.5 font-semibold text-sky-400 text-center">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 font-mono text-gray-100 text-center">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>

                  {/* RSI */}
                  <td
                    className={`py-2.5 font-mono text-center ${
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
                    className={`py-2.5 font-semibold text-center ${
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
