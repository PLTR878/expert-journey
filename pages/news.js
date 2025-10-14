import { useEffect, useState } from "react";

export default function News() {
  const [symbol, setSymbol] = useState("AAPL");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // โหลดข่าวจาก API
  async function loadNews(sym) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/news?symbol=${encodeURIComponent(sym)}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const j = await res.json();
      setNews(j.items || []);
    } catch (err) {
      console.error(err);
      setError("⚠️ Cannot load news for " + sym);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews(symbol);
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white px-4 py-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
        🧠 AI Early Signals
      </h1>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter stock symbol (e.g. NVDA, IREN, BTDR)"
          className="flex-1 bg-[#141b2d] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-400"
        />
        <button
          onClick={() => loadNews(symbol)}
          className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          🔍 Search
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center text-gray-400 py-4">Loading news...</div>
      )}
      {error && (
        <div className="text-center text-red-400 py-4">{error}</div>
      )}

      {/* No Results */}
      {!loading && !error && news.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No recent news found for <b>{symbol}</b>
        </div>
      )}

      {/* News List */}
      <div className="grid gap-4">
        {news.map((n, i) => (
          <a
            key={i}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#141b2d]/70 hover:bg-[#1d2941]/80 border border-white/10 rounded-2xl p-4 transition shadow-sm"
          >
            <h2 className="text-emerald-300 font-semibold text-lg mb-1">
              {n.title}
            </h2>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>{n.publisher}</span>
              <span>{n.published}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs mt-8">
        Powered by Yahoo Finance API
      </div>
    </main>
  );
            }
