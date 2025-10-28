// ✅ OriginX — Fully Linked Version (ScannerSection Connected + Stable)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSection from "../components/ScannerSection"; // ✅ เชื่อมเข้ามาแล้ว

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-100), `${new Date().toLocaleTimeString()} ${msg}`]);

  // โหลดข้อมูลหุ้นต้นน้ำ
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

  useEffect(() => {
    loadDiscovery();
  }, []);

  // โหลด Favorites จาก LocalStorage
  useEffect(() => {
    try {
      const fav = localStorage.getItem("favorites");
      if (fav) setFavorites(JSON.parse(fav));
    } catch (e) {
      console.error("Load favorites error:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ แสดงหน้าแต่ละแท็บ
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

    if (active === "scan") return <ScannerSection />; // ✅ เรียกใช้ ScannerSection ที่เชื่อมแล้ว

    if (active === "trade")
      return (
        <div className="text-center py-20 text-gray-400 italic">
          🤖 AI Trade — Coming soon...
        </div>
      );

    return null;
  };

  // ✅ Layout หลัก
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
