// ✅ OriginX AI Super Scanner — v∞.46 (Ultra Stable + Max Speed + Safe Save)
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
  const [batch, setBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(1);
  const [maxPerBatch, setMaxPerBatch] = useState(300); // ✅ เร็วแต่ปลอดภัย

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

  // ✅ บันทึก favorites
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

  // ✅ เตรียมจำนวน batch
  async function prepareScanner() {
    addLog("📦 Preparing symbol list...");
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const batches = Math.ceil(total / maxPerBatch);
    setTotalBatches(batches);
    addLog(`✅ Found ${total} symbols → ${batches} batches of ${maxPerBatch} each`);
  }

  // ✅ ดึงข้อมูล 1 batch
  async function runSingleBatch(batchNo) {
    try {
      const res = await fetch(`/api/market-scan?batch=${batchNo}`, { cache: "no-store" });
      const j = await res.json();
      return j?.results || [];
    } catch {
      return [];
    }
  }

  // ✅ สแกนตลาดทั้งหมด (เร็ว เสถียร ปลอด block)
  async function runFullScanner() {
    setLoading(true);
    setScannerResults([]);
    await prepareScanner();

    let allResults = [];
    const delayPerBatch = 150; // ✅ 150ms = เร็วสุดที่ไม่พัง

    for (let i = 1; i <= totalBatches; i++) {
      setBatch(i);
      addLog(`🚀 Scanning batch ${i}/${totalBatches}...`);
      const results = await runSingleBatch(i);

      if (results?.length) {
        allResults.push(...results);
        addLog(`✅ Batch ${i} done (${results.length} stocks)`);
      } else {
        addLog(`⚠️ Batch ${i} empty`);
      }

      await new Promise((r) => setTimeout(r, delayPerBatch));
    }

    // ✅ รวมครบแล้วคัด Top 20 ที่ AI มั่นใจที่สุด
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

  // ✅ โหลด Discovery ตอนเปิดหน้า
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
              prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
            )
          }
        />
      );

    if (active === "scan")
      return (
        <section className="p-4">
          <h2 className="text-xl font-bold text-center mb-3 text-emerald-400">
            🚀 AI Super Scanner (Full Market)
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
                Showing Top {scannerResults.length} AI Picks (Saved)
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
              🔎 กด “Run Full Market Scan” เพื่อเริ่มการสแกนและบันทึกผล AI
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
