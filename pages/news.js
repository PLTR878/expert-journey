// /pages/news.js
import { useEffect, useState } from "react";

export default function News() {
  const [symbol, setSymbol] = useState("AAPL");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadNews(sym) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/news?symbol=${sym}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const j = await res.json();
      setNews(j.items || []);
    } catch (err) {
      setError("⚠️ Failed to load news");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews(symbol);
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white p-4">
      <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-4">
        🧠 AI Early Signals — Live Stock News
      </h1>

      {/* ค้นหุ้น */}
      <div className="flex gap-2 mb-4">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol (ex. NVDA, AAPL, IREN)"
          className="bg-[#141b2d] border border-white/10 rounded-lg px-3 py-2 text-white w-full outline-none"
        />
        <button
          onClick={() => loadNews(symbol)}
          className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 px-4 py-2 rounded-lg"
        >
          🔍 Search
        </button>
      </div>

      {loading && <div className="text-gray-400 text-center">Loading...</div>}
      {error && <div className="text-red-400 text-center">{error}</div>}

      {!loading && !error && news.length === 0 && (
        <div className="text-center text-gray-400">
          No news found for <b>{symbol}</b>
        </div>
      )}

      {/* รายการข่าว */}
      <div className="grid gap-4">
        {news.map((n, i) => (
          <a
            key={i}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#141b2d]/70 hover:bg-[#1e2a44]/70 border border-white/10 rounded-xl p-4 transition"
          >
            <h2 className="text-emerald-300 font-semibold text-lg mb-1">
              {n.title}
            </h2>
            <p className="text-gray-400 text-sm mb-2">{n.publisher}</p>
            <p className="text-gray-500 text-xs">{n.published}</p>
          </a>
        ))}
      </div>
    </main>
  );
            }
