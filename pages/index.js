// ✅ /pages/index.js — Visionary Home (Simplified Mode, No Auth/VIP)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSwitcher from "../components/ScannerSwitcher";
import SettinMenu from "../components/SettinMenu";

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

  // ✅ โหลด Favorites จาก localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {
      console.error("❌ Load favorites error:", e);
    }
  }, []);

  // ✅ บันทึก Favorites กลับเข้า localStorage
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("❌ Save favorites error:", e);
    }
  }, [favorites]);

  const go = (tab) => {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ เรนเดอร์หน้าแต่ละส่วน
  const renderPage = () => {
    switch (active) {
      case "favorites":
        return <Favorites favorites={favorites} setFavorites={setFavorites} />;
      case "market":
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
      case "scan":
        return <ScannerSwitcher />;
      case "settings":
        return <SettinMenu />;
      default:
        return <MarketSection />;
    }
  };

  // ✅ UI หลัก
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* ✅ แถบเมนูด้านล่าง */}
      <nav className="fixed bottom-3 left-3 right-3 bg-[#0b1220]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-around text-gray-400 text-[13px] font-extrabold uppercase py-3 shadow-lg shadow-black/30">
        {[
          { id: "favorites", label: "Favorites" },
          { id: "market", label: "OriginX" },
          { id: "scan", label: "Scanner" },
          { id: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
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
