// ✅ Visionary Stock Screener — V∞.25
// (AI Discovery Pro + Scanner UI เปล่า)
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

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ โหลด Favorites จาก LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ Toggle Favorite
  const toggleFavorite = async (sym) => {
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );
    await fetchPrice(sym);
  };

  // ✅ ดึงราคาหุ้นรายตัวจาก visionary-core
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

  // ✅ โหลดข้อมูลหุ้นต้นน้ำ (เชื่อม API ตัวใหม่)
  async function loadDiscovery() {
    try {
      addLog("🌋 AI Discovery Pro กำลังค้นหาหุ้นต้นน้ำ...");
      const res = await fetch(`/api/visionary-discovery-pro`, { cache: "no-store" });
      const j = await res.json();

      const list = j.discovered || [];
      if (!list.length) throw new Error("ไม่พบข้อมูลหุ้นจาก AI Discovery");

      const formatted = list.map((r) => ({
        symbol: r.symbol,
        lastClose: r.price || 0,
        rsi: r.rsi || 0,
        reason: r.reason,
        aiScore: r.aiScore,
        trend: r.aiScore > 80 ? "Uptrend" : "Sideway",
      }));

      setFutureDiscovery(formatted);
      addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);

      for (const s of formatted) await fetchPrice(s.symbol);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
    }
  }

  // ✅ โหลดตอนเปิดหน้า
  useEffect(() => {
    loadDiscovery();
  }, []);

  // ✅ ดึงราคาหุ้นใน Favorites
  useEffect(() => {
    favorites.forEach(fetchPrice);
  }, [favorites]);

  // ===== UI =====
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="px-3 py-1 h-[4px] bg-[#0b1220]" />

      <div className="max-w-6xl mx-auto px-3 pt-2">
        {/* ❤️ Favorites */}
        {active === "favorites" && (
          <section className="mt-2">
            <Favorites
              data={favorites.map((f) => favoritePrices[f] || { symbol: f })}
              favorites={favorites}
              setFavorites={setFavorites}
              fetchPrice={fetchPrice}
            />
          </section>
        )}

        {/* 🌋 หุ้นต้นน้ำ */}
        {active === "market" && (
          <MarketSection
            title="🌋 หุ้นต้นน้ำ อนาคตไกล (AI Discovery Pro)"
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
        )}

        {/* 📡 Scanner UI ว่าง */}
        {active === "scan" && (
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
        )}

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
      </div>

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
