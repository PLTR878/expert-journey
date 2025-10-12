import { useState, useEffect } from "react";

export default function Screener() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/screener")
      .then((r) => r.json())
      .then((d) => {
        setData(d.rows || []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#0f1116] text-gray-100 flex flex-col">
      <header className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-lg font-semibold">📈 US AI Screener</h1>
        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">
          สแกนใหม่
        </button>
      </header>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <p className="p-6 text-center text-gray-400">กำลังโหลดข้อมูล...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#1a1d25] text-gray-400 text-xs uppercase">
              <tr>
                <th className="py-3 px-2 text-left w-24">สัญลักษณ์</th>
                <th className="py-3 px-2 text-right w-16">คะแนน</th>
                <th className="py-3 px-2 text-right w-24">ราคา</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.symbol}
                  className="border-b border-gray-800 hover:bg-[#181b22] transition"
                >
                  <td className="py-2 px-2">
                    <a
                      href={`/analyze/${row.symbol}`}
                      className="font-semibold text-blue-400 hover:underline"
                    >
                      {row.symbol}
                    </a>
                  </td>
                  <td
                    className={`text-right px-2 ${
                      row.score > 0
                        ? "text-green-400"
                        : row.score < 0
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {row.score?.toFixed?.(3)}
                  </td>
                  <td className="text-right px-2">{row.price?.toFixed?.(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="p-2 text-center text-xs text-gray-500 border-t border-gray-800">
        <p>© 2025 Expert Journey AI Screener</p>
      </footer>
    </main>
  );
    }
