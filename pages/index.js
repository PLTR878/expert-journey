// ✅ OriginX AI Super Scanner — v∞.53 (Merged Full Version with Enhanced Scanner UI)
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

  // ✅ ฟังก์ชันสแกนตลาดทั้งหมด
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

  // ✅ UI Renderer
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

    // ✅ แท็บใหม่ Scanner (เหมือนหน้า 1, 2)
    if (active === "scan")
      return (
        <section className="w-full px-[6px] sm:px-3 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
          {/* หัวข้อ + ปุ่ม Scan */}
          <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
            <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
              📡 OriginX AI Super Scanner
            </h2>
            <button
              onClick={runFullScanner}
              disabled={loading}
              className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 border border-gray-700 rounded-md px-3 py-[4px] bg-[#0f172a]/70 hover:bg-[#162032]"
            >
              {loading ? "⏳ Scanning..." : "🔍 Scan"}
            </button>
          </div>

          {/* รายการหุ้น */}
          <div className="flex flex-col divide-y divide-gray-800/50">
            {scannerResults?.length ? (
              scannerResults.map((r, i) => (
                <Link
                  key={r.symbol + i}
                  href={`/analyze/${r.symbol}`}
                  className="flex items-center justify-between py-[10px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
                >
                  {/* โลโก้วงกลม */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#0b0f17] flex items-center justify-center overflow-hidden">
                      <img
                        src={`https://logo.clearbit.com/${r.symbol.toLowerCase()}.com`}
                        alt={r.symbol}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class='w-full h-full bg-white flex items-center justify-center rounded-full border border-gray-300'>
                            <span class='text-black font-extrabold text-[11px] uppercase'>${r.symbol}</span>
                          </div>`;
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-white hover:text-emerald-400 font-extrabold text-[15px]">
                        {r.symbol}
                      </span>
                      <div className="text-[11px] text-gray-400 font-medium truncate max-w-[160px] leading-snug">
                        {r.companyName || "AI Discovery Candidate"}
                      </div>
                    </div>
                  </div>

                  {/* ราคา / RSI / Signal / AI% */}
                  <div className="text-right leading-tight font-mono min-w-[75px]">
                    <div className="text-[15px] text-white font-black">
                      {r.last ? `$${r.last.toFixed(2)}` : "-"}
                    </div>
                    <div
                      className={`text-[13px] font-bold ${
                        r.rsi > 70
                          ? "text-red-400"
                          : r.rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {r.rsi ? `RSI ${Math.round(r.rsi)}` : "RSI -"}
                    </div>
                    <div
                      className={`text-[13px] font-extrabold ${
                        r.signal === "Buy"
                          ? "text-green-400"
                          : r.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal || "-"}
                    </div>
                    <div className="text-[12px] text-gray-400 font-semibold">
                      AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-6 text-center text-gray-500 italic">
                {loading
                  ? "⏳ กำลังสแกนตลาดทั้งหมด..."
                  : "กดปุ่ม 🔍 Scan เพื่อเริ่มสแกนตลาด"}
              </div>
            )}
          </div>
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
