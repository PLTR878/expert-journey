import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  // Theme
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  // Load Data
  async function loadAll() {
    setLoading(true);
    setError("");

    async function fetchData(horizon) {
      try {
        const res = await fetch("/api/screener", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizon }),
        });
        const j = await res.json();
        console.log("✅ Screener", horizon, j);
        return j?.results || [];
      } catch (err) {
        console.error("❌ Error:", err);
        return [];
      }
    }

    try {
      const [shortData, mediumData, longData] = await Promise.all([
        fetchData("short"),
        fetchData("medium"),
        fetchData("long"),
      ]);
      setDataShort(shortData);
      setDataMedium(mediumData);
      setDataLong(longData);
    } catch (err) {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Table Component
  const renderTable = (title, color, data) => (
    <div className="my-6">
      <h2 className={`text-xl font-bold mb-3 ${color}`}>{title}</h2>
      {data.length === 0 ? (
        <div className="text-gray-400 text-sm mb-6">
          ⚠️ ไม่มีข้อมูล หรือ API ไม่ส่งผลลัพธ์
        </div>
      ) : (
        <table className="w-full text-sm border-collapse mb-6">
          <thead className="bg-[#162034] text-gray-300">
            <tr>
              <th className="p-2 text-left">สัญลักษณ์</th>
              <th className="p-2 text-right">คะแนน</th>
              <th className="p-2 text-right">ราคา</th>
              <th className="p-2 text-right">RSI</th>
              <th className="p-2 text-center">EMA20/50/200</th>
              <th className="p-2 text-center">AI Signal</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr
                key={r.symbol}
                className="border-b border-gray-700 hover:bg-[#1c2538]/70 transition"
              >
                <td className="p-2 font-semibold text-blue-400">
                  <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                </td>
                <td className="p-2 text-right">
                  {r.score ? r.score.toFixed(3) : "-"}
                </td>
                <td className="p-2 text-right">
                  {r.lastClose?.toFixed?.(2) ?? "-"}
                </td>
                <td className="p-2 text-right">{r.rsi?.toFixed?.(1) ?? "-"}</td>
                <td className="p-2 text-center">
                  {[
                    r.e20?.toFixed?.(2) ?? "-",
                    r.e50?.toFixed?.(2) ?? "-",
                    r.e200?.toFixed?.(2) ?? "-",
                  ].join(" / ")}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={
                      r.signal === "Buy"
                        ? "text-green-400 font-bold"
                        : r.signal === "Sell"
                        ? "text-red-400 font-bold"
                        : "text-yellow-300 font-semibold"
                    }
                  >
                    {r.signal || "-"}
                  </span>
                  <br />
                  <small className="text-gray-400">
                    {r.conf ? (r.conf * 100).toFixed(0) + "%" : "-"}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // UI
  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 bg-[#101829]/90 backdrop-blur-md border-b border-gray-700 z-50">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 gap-3">
          <b className="text-xl font-semibold">🌍 Visionary Stock Screener</b>
          <button
            onClick={loadAll}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded font-semibold"
          >
            {loading ? "กำลังโหลด..." : "รีเฟรชทั้งหมด"}
          </button>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="px-2 py-1 rounded bg-[#1c2538] text-white"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </header>

      <div className="px-4 py-5">
        {error && <div className="text-center text-red-400">{error}</div>}

        {renderTable("⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด", "text-green-400", dataShort)}
        {renderTable("🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่", "text-yellow-400", dataMedium)}
        {renderTable("🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต", "text-blue-400", dataLong)}
      </div>
    </main>
  );
                  }
