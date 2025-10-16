export default function NewsFeed({ items=[] }) {
  return (
    <section className="bg-[#101827]/70 rounded-2xl p-4 mb-6 border border-purple-400/30">
      <h2 className="text-purple-400 text-xl font-semibold mb-4">🧠 AI Market News — Early Signals</h2>
      {items.length===0 ? (<div className="text-center text-gray-400">No news data available.</div>) :
        items.slice(0,12).map((n,i)=>(
          <div key={i} className="border border-white/10 bg-[#0e1628]/80 rounded-xl p-4 mb-3">
            <div className="flex justify-between text-[12px] text-gray-400 mb-1">
              <span className="text-sky-400 font-semibold">{n.symbol}</span>
              <span>{n.time || n.date || ""}</span>
            </div>
            <div className="text-[15px] font-medium text-emerald-300 mb-1">{n.title}</div>
            <div className="text-[13px] text-gray-400 mb-2">{n.publisher}</div>
            <span className={`text-xs font-semibold ${
              n.sentiment==="Positive"?"text-green-400":n.sentiment==="Negative"?"text-red-400":"text-yellow-400"
            }`}>{n.sentiment||"Neutral"}</span>
          </div>
        ))
      }
    </section>
  );
}
