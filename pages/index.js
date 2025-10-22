// ✅ Visionary Stock Screener — V∞.30 (Rebuilt Stable System)
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

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

  // โหลด Favorite
  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // ดึงราคาหุ้นเดี่ยว
  async function fetchPrice(sym) {
    try {
      const r = await fetch(`/api/visionary-core?symbol=${sym}`);
      const j = await r.json();
      setFavoritePrices((p) => ({
        ...p,
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
    } catch (e) {
      addLog(`❌ ${sym} failed: ${e.message}`);
    }
  }

  // โหลดพอร์ตหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoadingDiscovery(true);
      addLog("🌋 AI Discovery Pro กำลังโหลดพอร์ต...");
      const res = await fetch("/api/ai-portfolio?_t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const j = await res.json();
      const list = j.top30 || [];
      if (!list.length) throw new Error("ไม่พบข้อมูลพอร์ต AI");

      const formatted = list.map((r) => ({
        symbol: r.symbol,
        lastClose: r.price || 0,
        rsi: r.rsi || 0,
        signal: r.signal,
        reason: r.reason,
      }));
      setFutureDiscovery(formatted);
      addLog(`✅ โหลดสำเร็จ ${formatted.length} ตัว`);
      for (const s of formatted.slice(0, 30)) await fetchPrice(s.symbol);
    } catch (e) {
      addLog(`⚠️ Discovery failed: ${e.message}`);
    } finally {
      setLoadingDiscovery(false);
    }
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  const renderPage = () => (
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
      toggleFavorite={(sym) =>
        setFavorites((p) =>
          p.includes(sym) ? p.filter((x) => x !== sym) : [...p, sym]
        )
      }
      favoritePrices={favoritePrices}
    />
  );

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="px-3 py-1 h-[4px]" />
      <div className="max-w-6xl mx-auto px-3 pt-2">{renderPage()}</div>

      {/* Logs */}
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

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px]">
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
