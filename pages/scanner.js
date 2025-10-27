import { useEffect, useState } from "react";

export default function Scanner() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const symbols = ["TMC", "PLTR", "SLDP", "ENVX", "BEEM", "NRGV", "QS", "LWLG"];
    const results = [];
    for (const s of symbols) {
      const res = await fetch(`/api/signal?symbol=${s}`);
      const data = await res.json();
      results.push(data);
    }
    setSignals(results);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">⏳ กำลังสแกนตลาด...</div>;

  const renderTable = (type, color, label) => (
    <div className="bg-[#111827] p-4 rounded-2xl shadow-lg">
      <h2 className={`text-lg font-semibold mb-2 ${color}`}>{label}</h2>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th>Symbol</th>
            <th>RSI</th>
            <th>MACD</th>
            <th>ADX</th>
            <th>AI%</th>
            <th>Change</th>
            <th>เหตุผล</th>
          </tr>
        </thead>
        <tbody>
          {signals
            .filter((s) => s.signal === type)
            .map((s) => (
              <tr key={s.symbol} className="border-b border-gray-800">
                <td className="font-bold text-white">{s.symbol}</td>
                <td>{s.rsi?.toFixed(1)}</td>
                <td>{s.macd?.toFixed(2)}</td>
                <td>{s.adx?.toFixed(1)}</td>
                <td>{s.aiScore}%</td>
                <td className={s.change > 0 ? "text-green-400" : "text-red-400"}>
                  {s.change > 0 ? "+" : ""}
                  {s.change.toFixed(2)}%
                </td>
                <td className="text-gray-400">{s.reason}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0b1220] text-white p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">🚀 AI Super Scanner</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderTable("BUY", "text-green-400", "🟢 ซื้อ")}
        {renderTable("HOLD", "text-yellow-300", "⚪ ถือ")}
        {renderTable("SELL", "text-red-400", "🔴 ขาย")}
      </div>
    </main>
  );
              }
