import { useEffect, useState } from "react";

export default function News() {
  const [symbol, setSymbol] = useState("NVDA"); // ค่าเริ่มต้น
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadNews(sym) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/news?symbol=${sym}`);
      if (!res.ok) throw new Error("Failed to load news");
      const j = await res.json();
      setNews(j.items || []);
    } catch (e) {
      setError("❌ Error loading news");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews(symbol);
  }, [symbol]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white p-4">
      <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-4">
        🧠 AI Early Signals — Live Stock News
      </h1>

      {/* ช่องค้นหุ้น */}
      <div className="flex gap-2 mb-4">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol (ex. NVDA, AAPL, IREN)"
          className="bg-[#141b2d] text-white px-3 py-2 rounded-lg w-full outline-none border border-white/10"
        />
        <button
          onClick={() => loadNews(symbol)}
          className="bg-emerald-500/20 hover:bg-emerald-500/30 px-4 py-2 rounded-lg border border-emerald-400/30"
        >
          🔍 Search
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-400 animate-pulse">Loading...</div>
      )}
      {error && <div className="text-center text-red-400">{error}</div>}

      {news.length === 0 && !loading && (
        <div className="text-center text-gray-400">
          No news found for <b>{symbol}</b>.
        </div>
      )}

      {/* แสดงข่าว */}
      <div className="grid gap-4 mt-4">
        {news.map((n, i) => (
          <a
            key={i}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#141b2d]/70 hover:bg-[#1e2a44]/70 transition border border-white/10 rounded-xl p-4 shadow"
          >
            <h2 className="text-emerald-300 font-semibold text-lg mb-1">
              {n.title}
            </h2>
            <div className="text-sm text-gray-400 mb-2">
              📰 {n.publisher} | {n.published}
            </div>
          </a>
        ))}
      </div>
    </main>
  );
            }
