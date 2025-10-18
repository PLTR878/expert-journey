// ✅ /components/Favorites.js — Visionary Eternal Edition (V∞.4 Ready)
export default function Favorites({ data }) {
  return (
    <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-white/10 shadow-lg">
      <h2 className="text-yellow-300 text-lg font-semibold mb-3 flex items-center gap-2">
        ⭐ My Favorites
        <span className="text-[11px] text-gray-400">
          ({data?.length || 0} symbols)
        </span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-center">
          <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
            <tr>
              <th className="p-2">Symbol</th>
              <th className="p-2">Price</th>
              <th className="p-2">RSI</th>
              <th className="p-2">AI Signal</th>
            </tr>
          </thead>
          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {/* Symbol */}
                  <td className="p-2 font-semibold text-sky-400">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400"
                    >
                      {r.symbol}
                    </a>
                  </td>

                  {/* Price */}
                  <td className="p-2 font-mono text-gray-100">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>

                  {/* RSI */}
                  <td
                    className={`p-2 ${
                      typeof r.rsi === "number"
                        ? r.rsi > 70
                          ? "text-red-400"
                          : r.rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {typeof r.rsi === "number"
                      ? Math.round(r.rsi)
                      : "-"}
                  </td>

                  {/* AI Signal */}
                  <td
                    className={`p-2 font-semibold ${
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
                  className="p-4 text-gray-500 text-center italic"
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
