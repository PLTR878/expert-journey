// ✅ OriginX — Fully Linked Version (Settings Connected + Stable + Floating Nav)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSection from "../components/ScannerSection";
import SettingsPage from "../components/SettingsPage"; // ✅ ใช้ SettingsPage ตัวใหม่

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ โหลดข้อมูลหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      setFutureDiscovery(j.results || []);
    } catch (err) {
      console.error("Discovery load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  // ✅ โหลด Favorites จาก LocalStorage
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
          title="OriginX (AI Discovery)"
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

    if (active === "scan") return <ScannerSection />;

    // ✅ SettingsPage มาแทน AI Trade
    if (active === "settings") return <SettingsPage />;

    return null;
  };

  // ✅ Layout หลัก (มี Settings เป็นแท็บที่ 4)
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* ✅ Bottom Navigation — Floating, Larger, Clean */}
      <nav className="fixed bottom-3 left-3 right-3 bg-[#0b1220]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-around text-gray-400 text-[13px] font-extrabold tracking-wide uppercase py-3 shadow-lg shadow-black/30">
        {[
          { id: "favorites", label: "Favorites" },
          { id: "market", label: "OriginX" },
          { id: "scan", label: "Scanner" },
          { id: "settings", label: "Settings" }, // ✅ เปลี่ยนจาก AI Trade เป็น Settings
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`transition-all px-2 ${
              active === t.id
                ? "text-emerald-400 border-b-2 border-emerald-400 pb-1"
                : "text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
  }
