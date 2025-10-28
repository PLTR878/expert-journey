// ✅ OriginX AI Super Scanner — v∞.42 (Full Market + AI Ranking Top 20)
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [scannerResults, setScannerResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [batch, setBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);
  const [maxPerBatch, setMaxPerBatch] = useState(50);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-60), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ โหลด Favorites จาก localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {
      console.error("❌ Load favorites error:", e);
    }
  }, []);

  // ✅ บันทึก Favorites
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("❌ Save favorites error:", e);
    }
  }, [favorites]);

  // ✅ โหลดหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      addLog("🌋 Loading AI Discovery...");
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      const list = j.results || [];
      setFutureDiscovery(list);
      addLog(`✅ Loaded ${list.length} discovery stocks`);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ✅ เตรียมจำนวน batch
  async function prepareScanner() {
    try {
      addLog("📦 Preparing symbol list...");
      const res = await fetch("/api/symbols");
      const j = await res.json();
      const total = j.total || 7000;
      const batches = Math.ceil(total / maxPerBatch);
      setTotalBatches(batches);
      addLog(`✅ Found ${total} symbols → ${batches} batches of ${maxPerBatch} each`);
    } catch (err) {
      addLog(`⚠️ Symbol list error: ${err.message}`);
    }
  }

  // ✅ สแกน batch เดียว
  async function runSingleBatch(batchNo) {
    try {
      addLog(`🚀 Running batch ${batchNo}/${totalBatches}...`);
      const res = await fetch(`/api/market-scan?batch=${batchNo}`, { cache: "no-store" });
      const data = await res.json();
      return data?.results || [];
    } catch (err) {
      addLog(`❌ Batch ${batchNo} error: ${err.message}`);
      return [];
    }
  }

  // ✅ สแกนทั้งตลาด + คัด Top 20 หุ้น AI มั่นใจที่สุด
  async function runFullScanner() {
    setLoading(true);
    setScannerResults([]);
    await prepareScanner();

    let allResults = [];

    for (let i = 1; i <= totalBatches; i++) {
      setBatch(i);
      const results = await runSingleBatch(i);
      allResults.push(...results);
      addLog(`✅ Batch ${i} done (${results.length} stocks)`);
      await new Promise((r) => setTimeout(r, 1000)); // ป้องกัน block
    }

    // ✅ คัดเฉพาะหุ้น BUY ที่คะแนน AI สูงสุด 20 ตัว
    const topPicks = allResults
      .filter((r) => r.signal === "Buy")
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 20);

    setScannerResults(topPicks);
    addLog(`🏁 Scan Completed | Showing Top ${topPicks.length} AI Picks ✅`);
    setLoading(false);
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  // ✅ หน้า UI
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

    if (active === "scan")
      return (
        <section className="p-4">
          <h2 className="text-xl font-bold text-center mb-3 text-emerald-400">
            🚀 AI Super Scanner (Top 20 Picks)
          </h2>

          <button
            onClick={runFullScanner}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold transition mb-4"
          >
            {loading
              ? `⏳ Scanning... (Batch ${batch}/${totalBatches})`
              : "🔍 Run Full Market Scan"}
          </button>

          {scannerResults.length > 0 ? (
            <>
              <div className="text-xs text-gray-400 mb-2">
                Showing Top {scannerResults.length} AI Picks (BUY only)
              </div>

              <div className="flex flex-col divide-y divide-gray-800/60">
                {scannerResults.map((r, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm">
                    <span className="font-bold text-white">{r.symbol}</span>
                    <span
                      className={`font-bold ${
                        r.signal === "Buy"
                          ? "text-green-400"
                          : r.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal}
                    </span>
                    <span className="text-gray-400">
                      RSI: {Math.round(r.rsi)} | AI: {r.aiScore}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 italic">
              🔎 กด “Run Full Market Scan” เพื่อเริ่มการสแกน AI Top 20 Picks
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
      <section className="mt-5 mb-10">
        <button
          onClick={() => setShowLogs((p) => !p)}
          className="flex items-center gap-2 bg-[#141b2d] border border-white/10 px-2 py-1 rounded-md text-[11px] text-emerald-400"
        >
          🧠 {showLogs ? "Hide Logs" : "Show Logs"}
        </button>
        {showLogs && (
          <div className="mt-2 bg-black/30 rounded-md border border-white/10 p-2 text-[11px] text-gray-400 max-h-44 overflow-auto">
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
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
