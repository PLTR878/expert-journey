// ✅ OriginX AI Super Scanner — v∞.52 (Logo + Vertical + Clickable + Stable)
import { useEffect, useState } from "react";
import Link from "next/link";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [scannerResults, setScannerResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [batch, setBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);
  const [maxPerBatch, setMaxPerBatch] = useState(300);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-100), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ โหลด favorites และผลสแกนเก่า
  useEffect(() => {
    try {
      const fav = localStorage.getItem("favorites");
      if (fav) setFavorites(JSON.parse(fav));
      const savedTop = localStorage.getItem("aiTopPicks");
      if (savedTop) setScannerResults(JSON.parse(savedTop));
    } catch (err) {
      console.warn("Load data error:", err);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ โหลดหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      addLog("🌋 Loading AI Discovery...");
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      setFutureDiscovery(j.results || []);
      addLog(`✅ Loaded ${j.results?.length || 0} discovery stocks`);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ✅ เตรียม batch
  async function prepareScanner() {
    addLog("📦 Preparing symbol list...");
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const batches = Math.ceil(total / maxPerBatch);
    setTotalBatches(batches);
    addLog(`✅ Found ${total} symbols → ${batches} batches`);
  }

  async function runSingleBatch(batchNo) {
    try {
      const res = await fetch(`/api/visionary-batch?batch=${batchNo}`, {
        cache: "no-store",
      });
      const j = await res.json();
      return j?.results || [];
    } catch {
      return [];
    }
  }

  // ✅ สแกนตลาดทั้งหมด (UI ใหม่)
  async function runFullScanner() {
    setLoading(true);
    setScannerResults([]);
    await prepareScanner();

    let allResults = [];
    const delay = 200;

    for (let i = 1; i <= totalBatches; i++) {
      setBatch(i);
      addLog(`🚀 Scanning batch ${i}/${totalBatches}...`);
      const results = await runSingleBatch(i);

      if (results?.length) {
        allResults.push(...results);
        addLog(`✅ Batch ${i} done (${results.length} stocks)`);
      } else addLog(`⚠️ Batch ${i} empty`);

      await new Promise((r) => setTimeout(r, delay));
    }

    if (allResults.length > 0) {
      const topPicks = allResults
        .filter((r) => r.signal === "Buy")
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 20);

      setScannerResults(topPicks);
      localStorage.setItem("aiTopPicks", JSON.stringify(topPicks));
      addLog(`🏁 Scan Completed | Saved Top ${topPicks.length} AI Picks ✅`);
    } else {
      addLog("⚠️ No results found after full scan");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  // ✅ UI
  const renderPage = () => {
    if (active === "favorites")
      return <Favorites favorites={favorites} setFavorites={setFavorites} />;

    if (active === "market")
      return (
        <MarketSection
          title="🌋 OriginX (AI Discovery)"
          loading={loading}
          rows={futureDiscovery}
          favorites={favorites}
          toggleFavorite={(sym) =>
            setFavorites((prev) =>
              prev.includes(sym)
                ? prev.filter((x) => x !== sym)
                : [...prev, sym]
            )
          }
        />
      );

    // ✅ แท็บใหม่ Scanner
    if (active === "scan")
      return (
        <section className="p-4">
          <h2 className="text-xl font-bold text-center mb-3 text-emerald-400">
            🚀 OriginX AI Super Scanner (Full Market)
          </h2>

          <button
            onClick={runFullScanner}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold transition mb-3"
          >
            {loading
              ? `⏳ Scanning... (Batch ${batch}/${totalBatches})`
              : "🔍 Run Full Market Scan"}
          </button>

          {scannerResults.length > 0 ? (
            <>
              <div className="text-xs text-gray-400 mb-2 text-center">
                ✅ Showing Top {scannerResults.length} AI Picks
              </div>
              <div className="grid grid-cols-1 gap-2">
                {scannerResults.map((r, i) => (
                  <Link
                    key={i}
                    href={`/analyze/${r.symbol}`}
                    className="flex items-center gap-3 bg-[#111827] hover:bg-[#1f2937] transition border border-white/5 rounded-xl p-3"
                  >
                    {/* โลโก้หุ้น */}
                    <img
                      src={`https://finnhub.io/api/logo?symbol=${r.symbol}`}
                      alt={r.symbol}
                      className="w-8 h-8 rounded-md bg-white/10"
                      onError={(e) => (e.target.style.display = "none")}
                    />

                    {/* ข้อมูลแนวตั้ง */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-white text-sm">
                          {r.symbol}
                        </span>
                        <span
                          className={`font-bold text-xs ${
                            r.signal === "Buy"
                              ? "text-green-400"
                              : r.signal === "Sell"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {r.signal}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex justify-between mt-1">
                        <span>💵 ${r.last}</span>
                        <span>📊 RSI {Math.round(r.rsi)}</span>
                        <span>🤖 AI {Math.round(r.aiScore)}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center mt-6">
              🔎 กด “Run Full Market Scan” เพื่อเริ่มการสแกนด้วย AI
            </p>
          )}
        </section>
      );

    if (active === "trade")
      return (
        <div className="text-center py-20 text-gray-400 italic">
          🤖 AI Trade — Coming soon...
        </div>
      );

    return null;
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* 🧠 Logs */}
      <section className="mt-5 mb-10 px-4">
        <button
          onClick={() => setLogs([])}
          className="text-xs bg-[#1f2937] px-2 py-1 rounded-md text-emerald-400 border border-emerald-500/30"
        >
          🧠 Clear Logs
        </button>
        <div className="mt-2 bg-black/30 rounded-md border border-white/10 p-2 text-[11px] text-gray-400 max-h-44 overflow-auto">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </section>

      {/* ✅ Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px]">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "OriginX", icon: "🌋" },
          { id: "scan", label: "Scanner", icon: "📡" },
          { id: "trade", label: "AI Trade", icon: "🤖" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`py-1 flex flex-col items-center ${
              active === t.id ? "text-emerald-400" : ""
            }`}
          >
            <span className="text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
    }
