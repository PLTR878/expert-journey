// ✅ /components/OptionXSection.js — OptionX Analyzer UI
import { useState } from "react";

export default function OptionXSection() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const scanOption = async () => {
    if (!symbol) return alert("กรอกชื่อหุ้นก่อน เช่น PLTR");
    setLoading(true);
    setData(null);
    try {
      const r = await fetch(`/api/optionx-analyzer?symbol=${symbol}`);
      const j = await r.json();
      setData(j);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#0b1220] text-white min-h-screen">
      <h1 className="text-2xl font-bold text-pink-400 mb-4">
        ¥ OptionX — AI Option Scanner
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          className="bg-[#141a2b] p-2 rounded-md flex-1 outline-none"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="เช่น PLTR, SOUN, RXRX..."
        />
        <button
          onClick={scanOption}
          className="bg-pink-500 hover:bg-pink-600 px-4 rounded-md"
        >
          {loading ? "กำลังสแกน..." : "SCAN"}
        </button>
      </div>

      {data && !data.error && (
        <>
          <div className="bg-[#141a2b] p-4 rounded-lg mb-4">
            <p>หุ้น: <b>{data.symbol}</b></p>
            <p>ราคาปัจจุบัน: <b>${data.price}</b></p>
            <p className="text-emerald-400 mt-2 text-lg">
              สัญญาณ AI: {data.signal} 🚀
            </p>
            <p className="text-gray-400 text-sm">{data.reason}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OptionTable title="Calls" list={data.calls} color="emerald" />
            <OptionTable title="Puts" list={data.puts} color="rose" />
          </div>
        </>
      )}
    </div>
  );
}

function OptionTable({ title, list, color }) {
  return (
    <div className={`bg-[#141a2b] p-3 rounded-lg border border-${color}-500/40`}>
      <h2 className={`text-${color}-400 font-semibold mb-2`}>{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th>Strike</th>
            <th>Last</th>
            <th>ROI%</th>
          </tr>
        </thead>
        <tbody>
          {list.map((o, i) => (
            <tr key={i} className="text-center">
              <td>{o.strike}</td>
              <td>{o.last}</td>
              <td className={o.roi > 0 ? "text-emerald-400" : "text-rose-400"}>
                {o.roi}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
            }
