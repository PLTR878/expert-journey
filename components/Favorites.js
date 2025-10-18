// ✅ /components/Favorites.js — Force True Gray Edition (V∞.18)
export default function Favorites({ data }) {
  return (
    <section className="w-full px-2">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px] text-center border-collapse">
          <thead>
            <tr
              className="text-[#a1a1aa] text-[12px] uppercase select-none"
              style={{
                borderBottom: "1px solid #20242f !important",
              }}
            >
              <th className="py-2 font-medium text-left pl-3 w-[30%]">SYMBOL</th>
              <th className="py-2 font-medium text-right pr-2 w-[23%]">PRICE</th>
              <th className="py-2 font-medium text-right pr-2 w-[22%]">RSI</th>
              <th className="py-2 font-medium text-right pr-2 w-[25%]">AI SIG</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((r, i) => (
                <tr
                  key={r.symbol + i}
                  className="transition-all hover:bg-[#151821]/70"
                  style={{
                    borderBottom: "1px solid #1b1f29 !important", // ✅ สีเทาอ่อนจริง (ไม่โดน override)
                  }}
                >
                  <td className="py-3 text-left pl-3 font-semibold text-sky-400">
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {r.symbol}
                    </a>
                  </td>
                  <td className="py-3 text-right pr-2 font-mono text-gray-100">
                    {r.price != null ? `$${Number(r.price).toFixed(2)}` : "-"}
                  </td>
                  <td
                    className={`py-3 text-right pr-2 font-mono ${
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
                  <td
                    className={`py-3 text-right pr-2 font-semibold ${
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
                <td colSpan="4" className="py-4 text-gray-500 text-center italic">
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
