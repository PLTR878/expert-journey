import { useEffect, useState } from "react";

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSymbols() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/symbols");
        const data = await res.json();
        if (Array.isArray(data.symbols)) {
          setSymbols(data.symbols);
        } else {
          throw new Error("Invalid data format");
        }
      } catch (err) {
        console.error(err);
        setError("⚠️ โหลดข้อมูลหุ้นไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }
    loadSymbols();
  }, []);

  const filtered = symbols.filter((s) =>
    s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0b1220] text-white p-5 font-inter">
      <h1 className="text-lg font-bold text-emerald-400 mb-3">
        🌍 Trending Stocks
      </h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 พิมพ์ชื่อหุ้น เช่น NVDA, AAPL, TSLA..."
        className="w-full p-2 mb-4 rounded-lg bg-[#141b2d] border border-white/10 text-center text-gray-200 placeholder-gray-500"
      />

      {loading && <div className="text-gray-400">⏳ กำลังโหลด...</div>}
      {error && <div className="text-yellow-400">{error}</div>}

      <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
        {filtered.slice(0, 100).map((s) => (
          <li
            key={s.symbol}
            className="border border-white/10 rounded-lg p-2 hover:bg-white/5 flex justify-between items-center"
          >
            <span className="text-sky-400 font-semibold">{s.symbol}</span>
            <span className="text-gray-400 text-sm truncate w-[60%] text-right">
              {s.name || "-"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
          }
