// ✅ /components/Favorites.js — Visionary Ultra Flat Alignment (V∞.13 AI SIG Edition)
export default function Favorites({ data }) {
  return (
    <section className="w-full mb-2 px-2">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px] text-center border-collapse">
          {/* หัวตาราง */}
          <thead>
            <tr className="text-gray-400 text-[12px] uppercase select-none border-b border-white/5">
              <th className="py-2 font-medium text-left pl-4 w-[30%] tracking-wide">
                SYMBOL
              </th>
              <th className="py-2 font-medium text-right pr-4 w-[23%] tracking-wide">
                PRICE
              </th>
              <th className="py-2 font-medium text-right pr-4 w-[22%] tracking-wide">
                RSI
              </th>
              <th className="py-2 font-medium text-right pr-4 w-[25%] tracking-wide">
                AI SIG
              </th>
            </tr>
          </thead>

          {/* เนื้อหา */}
          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="transition-all hover:bg-[#162235]/60"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* SYMBOL */}
                  <td className="py-2.5 text-left pl-4 font-semibold text-sky-400 align-middle">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>

                  {/* PRICE */}
                  <td className="py-2.5 text-right pr-4 font-mono text-gray-100 align-middle">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>

                  {/* RSI */}
                  <td
                    className={`py-2.5 text-right pr-4 font-mono align-middle ${
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

                  {/* AI SIG */}
                  <td
                    className={`py-2.5 text-right pr-4 font-semibold align-middle ${
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
