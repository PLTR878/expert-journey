// ✅ Visionary Stock Screener — V∞.28 (Stable + AI Discovery Pro v2)
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  // ===== Log System =====
  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ===== Load Favorites =====
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

  // ===== Fetch Stock Price =====
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

  // ===== Load AI Discovery Pro v2 =====
  async function loadDiscovery(retry = 0) {
    try {
      setLoadingDiscovery(true);
      addLog("🌋 AI Discovery Pro (v2) กำลังค้นหาหุ้นต้นน้ำ...");
      
      // ✅ เชื่อม API ตัวใหม่
      const res = await fetch("/api/visionary-discovery-pro-v2", { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);

      const j = await res.json();
      const list = j.top || j.discovered || [];

      if (!list.length) throw new Error("ไม่พบข้อมูลหุ้นจาก AI Discovery");

      const formatted = list.map((r) => ({
        symbol: r.symbol,
        lastClose: parseFloat(r.price) || 0,
        rsi: r.rsi || 0,
        reason: r.reason || "AI พบแนวโน้มต้นน้ำชัดเจน + ข่าวเชิงบวก",
        aiScore: r.aiScore || 0,
        signal: r.signal || "Hold",
      }));

      setFutureDiscovery(formatted);
      addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro v2`);

      // ดึงราคาจริงเฉพาะ 30 ตัวแรก
      for (const s of formatted.slice(0, 30)) await fetchPrice(s.symbol);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
      if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
    } finally {
      setLoadingDiscovery(false);
    }
  }

  // ===== Load Data on Mount =====
  useEffect(() => {
    loadDiscovery();
  }, []);

  // ===== Load Prices for Favorites =====
  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ===== Render Page =====
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
              (r.signal || "Hold"),
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
            📡 AI Market Scanner (กำลังอยู่ในช่วงพัฒนา)
          </h2>
          <p className="text-sm text-gray-400">
            หน้านี้จะใช้สำหรับระบบสแกนหุ้นทั่วตลาดในอนาคต
          </p>
          <div className="mt-4 text-gray-500 text-[13px] italic">
            “Coming soon — ระบบ AI Scan หุ้นทั้งตลาดแบบเรียลไทม์”
          </div>
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
