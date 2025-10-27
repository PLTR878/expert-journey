// ✅ Visionary Stock Screener — V∞.33 (AI Super Scanner Integrated)
import { useEffect, useState } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import Scanner from "../pages/scanner"; // ✅ เพิ่ม Scanner ที่ทำงานจริง

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);

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

  // ✅ โหลดหุ้นต้นน้ำ (จำถาวร)
  useEffect(() => {
    const saved = localStorage.getItem("futureDiscovery");
    if (saved) {
      setFutureDiscovery(JSON.parse(saved));
      addLog("♻️ โหลดข้อมูลหุ้นต้นน้ำจาก LocalStorage");
    } else {
      loadDiscovery();
    }
  }, []);

  // ✅ ดึงข้อมูลหุ้นต้นน้ำจาก visionary-batch
  async function loadDiscovery() {
    try {
      setLoadingDiscovery(true);
      addLog("🌋 AI Discovery กำลังโหลดหุ้นต้นน้ำ...");

      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      const list = j.results || [];

      if (!list.length) throw new Error("ไม่พบข้อมูลหุ้นต้นน้ำ");

      setFutureDiscovery(list);
      localStorage.setItem("futureDiscovery", JSON.stringify(list));
      addLog(`✅ โหลดหุ้นต้นน้ำสำเร็จ ${list.length} ตัว`);
    } catch (err) {
      addLog(`⚠️ Discovery failed: ${err.message}`);
    } finally {
      setLoadingDiscovery(false);
    }
  }

  // ✅ Render หน้าแต่ละส่วน
  const renderPage = () => {
    if (active === "favorites") {
      return (
        <Favorites
          favorites={favorites}
          setFavorites={setFavorites}
        />
      );
    }

    if (active === "market") {
      return (
        <MarketSection
          title="OriginX  (AI Discovery)"
          loading={loadingDiscovery}
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
    }

    // ✅ แก้ส่วน Scanner ให้เชื่อมกับระบบจริง
    if (active === "scan")
      return (
        <div className="p-4">
          <h2 className="text-xl font-bold text-center mb-4 text-emerald-400">
            🚀 AI Super Scanner
          </h2>
          <Scanner /> {/* ✅ เรียก component Scanner จริง */}
        </div>
      );

    if (active === "trade")
      return (
        <div className="text-center py-20 text-gray-400 italic">
          🤖 AI Trade — Coming soon...
        </div>
      );

    return null;
  };

  // ✅ UI หลัก
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="px-3 py-1 h-[4px]" />
      <div className="max-w-6xl mx-auto px-3 pt-2">{renderPage()}</div>

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
