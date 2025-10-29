// ✅ OriginX — Fully Linked Version (ScannerSection Connected + Stable + No Logs + Clean Nav)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSection from "../components/ScannerSection";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลหุ้นต้นน้ำ
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

    if (active === "trade")
      return (
        <div className="text-center py-20 text-gray-400 italic">
          AI Trade — Coming soon...
        </div>
      );

    return null;
  };

  // ✅ Layout หลัก (ไม่มี Logs และไม่มีอีโมจิ)
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* ✅ Bottom Navigation — Clean Professional */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[12px] font-extrabold tracking-wide uppercase">
        {[
          { id: "favorites", label: "Favorites" },
          { id: "market", label: "OriginX" },
          { id: "scan", label: "Scanner" },
          { id: "trade", label: "AI Trade" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`py-2 transition-all ${
              active === t.id
                ? "text-emerald-400 border-t-2 border-emerald-400"
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
