// ✅ Visionary Stock Screener — V∞.27 (Stable Original UI)
// ปรับเฉพาะ logic การเชื่อม API ให้ทำงานจริง — UI เดิม 100%
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("favorites");
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  // ===== ฟังก์ชัน Log =====
  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ===== โหลด Favorites =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {
      console.error("⚠️ Favorite load error:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("⚠️ Favorite save error:", e);
    }
  }, [favorites]);

  // ===== ดึงราคาหุ้นรายตัว =====
  async function fetchPrice(sym) {
    if (!sym) return;
    try {
      const res = await fetch(`/api/visionary-core?type=daily&symbol=${sym}`);
      const j = await res.json();
      setFavoritePrices((prev) => ({
        ...prev,
        [sym]: {
          symbol: sym,
          price: j.lastClose || 0,
          rsi: j.rsi || 0,
          signal:
            j.trend === "Uptrend"
              ? "Buy"
              : j.trend === "Downtrend"
              ? "Sell"
              : "Hold",
        },
      }));
    } catch (err) {
      addLog(`❌ Fetch error ${sym}: ${err.message}`);
    }
  }

  // ===== Toggle Favorite =====
  const toggleFavorite = async (sym) => {
    if (!sym) return;
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );
    await fetchPrice(sym);
  };

  // ===== โหลดข้อมูลหุ้นต้นน้ำ =====
  async function loadDiscovery(retry = 0) {
    try {
      setLoadingDiscovery(true);
      addLog("🌋 AI Discovery Pro กำลังค้นหาหุ้นต้นน้ำ...");
      const res = await fetch("/api/visionary-discovery-pro", { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const j = await res.json();
      const list = j.discovered || [];

      if (!list.length) throw new Error("ไม่พบข้อมูลหุ้นจาก AI Discovery");

      const formatted = list.map((r) => ({
        symbol: r.symbol,
        lastClose: parseFloat(r.price) || 0,
        rsi: r.rsi || 0,
        reason: r.reason || "AI พบแนวโน้มต้นน้ำ",
        aiScore: r.aiScore || 0,
        trend: r.aiScore > 80 ? "Uptrend" : "Sideway",
      }));

      setFutureDiscovery(formatted);
      addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);

      for (const s of formatted.slice(0, 30)) await fetchPrice(s.symbol);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
      if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
    } finally {
      setLoadingDiscovery(false);
    }
  }

  // ===== โหลดตอนเปิดหน้า =====
  useEffect(() => {
    loadDiscovery();
  }, []);

  // ===== ดึงราคาของ Favorites =====
  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ===== สแกนหุ้นตลาดทั้งหมด =====
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerResults, setScannerResults] = useState([]);

  async function runMarketScan() {
    try {
      setScannerLoading(true);
      addLog("📡 เริ่มสแกนหุ้นตลาดอเมริกาทั้งหมด...");
      const res = await fetch("/api/visionary-auto-batch", { cache: "no-store" });
      const j = await res.json();
      if (j?.results?.length) {
        setScannerResults(j.results);
        addLog(`✅ พบหุ้นทั้งหมด ${j.results.length} ตัวจาก AutoBatch`);
      } else {
        addLog("⚠️ ไม่พบผลลัพธ์จาก AutoBatch");
      }
    } catch (err) {
      addLog(`❌ Scanner error: ${err.message}`);
    } finally {
      setScannerLoading(false);
    }
  }

  // ===== แสดงหน้า =====
  const renderPage = () => {
    if (active === "favorites")
      return (
        <Favorites
          data={favorites.map((f) => favoritePrices[f] || { symbol: f })}
          favorites={favorites}
          setFavorites={setFavorites}
          fetchPrice={fetchPrice}
        />
      );

    if (active === "market")
      return (
        <MarketSection
          title="🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)"
          loading={loadingDiscovery}
          rows={futureDiscovery.map((r) => ({
            symbol: r.symbol,
            price: favoritePrices[r.symbol]?.price || r.lastClose || 0,
            rsi: favoritePrices[r.symbol]?.rsi || r.rsi || 0,
            reason: r.reason,
            signal:
              favoritePrices[r.symbol]?.signal ||
              (r.trend === "Uptrend"
                ? "Buy"
                : r.trend === "Downtrend"
                ? "Sell"
                : "Hold"),
          }))}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          favoritePrices={favoritePrices}
        />
      );

    if (active === "scan")
      return (
        <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5 text-center mt-4">
          <h2 className="text-lg font-semibold text-emerald-400 mb-2">
            📡 AI Market Scanner
          </h2>

          <button
            onClick={runMarketScan}
            disabled={scannerLoading}
            className={`px-6 py-2 rounded-md text-white font-semibold mt-2 ${
              scannerLoading
                ? "bg-gray-600 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {scannerLoading ? "⏳ กำลังสแกน..." : "🔍 เริ่มสแกนหุ้นทั้งตลาด"}
          </button>

          {scannerLoading && (
            <div className="text-gray-400 text-sm mt-3">
              ระบบกำลังประมวลผล... โปรดรอ 1–2 นาที
            </div>
          )}

          {!scannerLoading && scannerResults.length > 0 && (
            <div className="mt-5 text-left overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1f2937] text-gray-300">
                    <th className="p-2 text-left">Symbol</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">RSI</th>
                    <th className="p-2 text-right">EMA20</th>
                    <th className="p-2 text-right">EMA50</th>
                    <th className="p-2 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {scannerResults.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-b border-gray-700 hover:bg-[#0f172a]">
                      <td className="p-2 text-emerald-400 font-bold text-left">
                        <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                      </td>
                      <td className="p-2 text-right">${r.last}</td>
                      <td className="p-2 text-right text-emerald-400">{r.rsi}</td>
                      <td className="p-2 text-right text-gray-300">{r.ema20}</td>
                      <td className="p-2 text-right text-gray-300">{r.ema50}</td>
                      <td
                        className={`p-2 text-right ${
                          r.trend === "Up"
                            ? "text-green-400"
                            : r.trend === "Down"
                            ? "text-red-400"
                            : "text-yellow-300"
                        }`}
                      >
                        {r.trend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      );

    return null;
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="px-3 py-1 h-[4px] bg-[#0b1220]" />
      <div className="max-w-6xl mx-auto px-3 pt-2">{renderPage()}</div>

      {/* 🧠 Logs */}
      <section className="mt-5 mb-10">
        <button
          onClick={() => setShowLogs((p) => !p)}
          className="flex items-center gap-2 bg-[#141b2d] border border-white/10 px-2 py-1 rounded-md text-[11px] text-emerald-400 hover:bg-emerald-500/10 transition-all"
        >
          <span className="text-[12px]">🧠</span>
          <span>{showLogs ? "Hide Logs" : "Show Logs"}</span>
        </button>

        {showLogs && (
          <div className="mt-2 bg-black/30 rounded-md border border-white/10 p-2 text-[11px] text-gray-400 max-h-44 overflow-auto shadow-inner">
            <ul className="space-y-0.5">
              {logs.length ? (
                logs.map((l, i) => <li key={i}>{l}</li>)
              ) : (
                <li className="text-gray-500">No logs yet.</li>
              )}
            </ul>
          </div>
        )}
      </section>

      {/* ✅ Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "หุ้นต้นน้ำ", icon: "🌋" },
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
