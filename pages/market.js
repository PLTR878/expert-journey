// ✅ /pages/market.js
import { useEffect, useState } from "react";

export default function Market() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลจาก API screener-hybrid
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/screener-hybrid");
        const j = await r.json();
        setData(j);
      } catch (err) {
        console.error("❌ Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400 animate-pulse">
        🔄 AI กำลังคัดหุ้นให้อยู่... โปรดรอสักครู่
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-red-400">
        ❌ โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง
      </div>
    );
  }

  const sections = [
    { title: "⚡ Fast Movers", key: "fast" },
    { title: "🌱 Emerging Trends", key: "emerging" },
    { title: "🚀 Future Leaders", key: "future" },
    { title: "💎 Hidden Gems", key: "hidden" },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white p-4">
      <h1 className="text-2xl font-bold text-center mb-2">
        🌍 Visionary Stock Screener — <span className="text-teal-400">V5.1 Galaxy</span>
      </h1>
      <div className="text-center text-gray-400 text-sm mb-6">
        Updated: {new Date(data.updated).toLocaleString()}
      </div>

      {sections.map((sec) => (
        <div
          key={sec.key}
          className="bg-[#111827] rounded-2xl shadow-lg mb-6 p-4 border border-gray-700"
        >
          <h2 className="text-lg font-semibold text-green-400 mb-3">
            {sec.title}
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="py-1 text-left w-8">⭐</th>
                <th className="py-1 text-left">SYMBOL</th>
                <th className="py-1 text-right">PRICE</th>
                <th className="py-1 text-right">RSI</th>
                <th className="py-1 text-center">AI</th>
              </tr>
            </thead>
            <tbody>
              {data[sec.key]?.length > 0 ? (
                data[sec.key].map((s, i) => (
                  <tr
                    key={s.symbol + i}
                    className="border-b border-gray-800 hover:bg-[#1a2234] transition"
                  >
                    <td className="py-1 text-yellow-400 text-center">★</td>
                    <td className="py-1 font-semibold">{s.symbol}</td>
                    <td className="py-1 text-right">${s.price?.toFixed(2)}</td>
                    <td className="py-1 text-right">{s.rsi?.toFixed(1)}</td>
                    <td
                      className={`py-1 text-center font-bold ${
                        s.signal === "Buy"
                          ? "text-green-400"
                          : s.signal === "Sell"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {s.signal}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-2 text-gray-500">
                    No data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
    }
