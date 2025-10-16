export default function Favorites({ data }) {
  return (
    <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
      <h2 className="text-yellow-300 text-lg font-semibold mb-3">⭐ My Favorites</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-center">
          <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
            <tr><th className="p-2">Symbol</th><th className="p-2">Price</th><th className="p-2">RSI</th><th className="p-2">AI</th></tr>
          </thead>
          <tbody>
            {data.length? data.map((r,i)=>(
              <tr key={r.symbol+i} className="border-b border-white/5">
                <td className="p-2 font-semibold text-sky-400"><a href={`/analyze/${r.symbol}`}>{r.symbol}</a></td>
                <td className="p-2 font-mono">{r.price!=null?`$${Number(r.price).toFixed(2)}`:"-"}</td>
                <td className="p-2">{typeof r.rsi==="number"?Math.round(r.rsi):"-"}</td>
                <td className={`p-2 font-semibold ${
                  r.signal==="Buy"?"text-green-400":r.signal==="Sell"?"text-red-400":"text-yellow-400"
                }`}>{r.signal || "-"}</td>
              </tr>
            )):(<tr><td colSpan="4" className="p-3 text-gray-500">No favorites yet.</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
                                   }
