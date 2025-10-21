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

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ โหลด Favorites
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  // ✅ ดึงราคา
  async function fetchPrice(sym) {
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

  const toggleFavorite = async (sym) => {
    setFavorites((prev) =>
      prev.includes(sym)
        ? prev.filter((x) => x !== sym)
        : [...prev, sym]
    );
    await fetchPrice(sym);
  };

  // ✅ โหลดหุ้นต้นน้ำ (AI Discovery)
  async function loadDiscovery(retry = 0) {
    try {
      setLoadingDiscovery(true);
      addLog("🌋 AI Discovery Pro กำลังค้นหาหุ้นต้นน้ำ...");
      const res = await fetch(`/api/visionary-discovery-pro`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const j = await res.json();

      const list = j.discovered || [];
      const formatted = list.map((r) => ({
        symbol: r.symbol,
        lastClose: r.price,
        aiScore: r.aiScore,
        reason: r.reason,
        trend: r.aiScore > 80 ? "Uptrend" : "Sideway",
      }));
      setFutureDiscovery(formatted);
      addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
      if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
    } finally {
      setLoadingDiscovery(false);
    }
  }

  useEffect(() => loadDiscovery(), []);

  const renderPage = () => {
    if (active === "favorites") {
      return (
        <Favorites
          data={favorites.map((f) => favoritePrices[f] || { symbol: f })}
          favorites={favorites}
          setFavorites={setFavorites}
          fetchPrice={fetchPrice}
        />
      );
    }

    if (active === "market") {
      return (
        <MarketSection
          title="🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)"
          loading={loadingDiscovery}
          rows={futureDiscovery}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          favoritePrices={favoritePrices}
        />
      );
    }

    if (active === "scan") {
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
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-2">{renderPage()}</div>

      {/* Logs */}
      {showLogs && (
        <section className="mt-5 mb-10 px-3">
          <div className="bg-black/30 rounded-md border border-white/10 p-2 text-[11px] text-gray-400 max-h-44 overflow-auto shadow-inner">
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "หุ้นต้นน้ำ", icon: "🌋" },
          { id: "scan", label: "Scanner", icon: "📡" },
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
