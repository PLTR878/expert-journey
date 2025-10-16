import { useEffect } from "react";

export default function MarketSection({ title, rows, favorites, favoritePrices, toggleFavorite }) {
  useEffect(()=>{},[rows]);
  const getPrice = (r, sym) =>
    r.price ?? r.lastClose ?? r.close ?? r.last ?? favoritePrices[sym]?.price ?? "-";
  const getRSI = (r, sym) => r.rsi ?? favoritePrices[sym]?.rsi ?? "-";
  const getSig = (r, sym) => r.signal ?? favoritePrices[sym]?.signal ?? "-";

  return (
    <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6">
      <h2 className="text-emerald-400 mb-2 font-semibold text-lg">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-center">
          <thead className="bg-white/5 text-gray-400 uppercase text-[11px]">
            <tr><th className="p-2 text-left pl-4">⭐</th><th className="p-2">Symbol</th><th className="p-2">Price</th><th className="p-2">RSI</th><th className="p-2">AI</th></tr>
          </thead>
          <tbody>
            {(rows||[]).length? rows.slice(0,20).map((r,i)=>{
              const sym = r.symbol || r.ticker || ""; if(!sym) return null;
              const fav = favorites.includes(sym);
              const priceVal = getPrice(r, sym);
              const rsi = getRSI(r, sym);
              const sig = getSig(r, sym);
              const color = sig==="Buy"?"text-green-400":sig==="Sell"?"text-red-400":"text-yellow-400";
              return (
                <tr key={sym+i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td onClick={()=>toggleFavorite(sym)} className="cursor-pointer text-yellow-400 pl-4 select-none">{fav?"★":"☆"}</td>
                  <td className="p-2 font-semibold text-sky-400"><a href={`/analyze/${sym}`}>{sym}</a></td>
                  <td className="p-2 font-mono">{priceVal!=="-"?`$${Number(priceVal).toFixed(2)}`:"-"}</td>
                  <td className="p-2">{typeof rsi==="number"?Math.round(rsi):rsi}</td>
                  <td className={`p-2 font-semibold ${color}`}>{sig}</td>
                </tr>
              );
            }):(
              <tr><td colSpan="5" className="p-3 text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
              }
