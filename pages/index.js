import { useState, useEffect } from "react";

import Reister from "../components/Reister";
import VipPae from "../components/VipPae";

import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSwitcher from "../components/ScannerSwitcher";
import SettinMenu from "../components/SettinMenu";

export default function Home() {
  const [stage, setStage] = useState("loading");
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ โหลดสถานะสมาชิก + VIP + Favorites (ถาวร)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = localStorage.getItem("username");
    const vip = localStorage.getItem("vip");
    const savedFav = localStorage.getItem("favorites");

    if (savedFav) setFavorites(JSON.parse(savedFav));

    if (!user) setStage("register");
    else if (vip !== "yes") setStage("vip");
    else setStage("app");
  }, []);

  // ✅ บันทึก Favorites กลับลง LocalStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  // ✅ โหลดแท็บล่าสุด
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("lastActiveTab");
    if (saved) setActive(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastActiveTab", active);
    }
  }, [active]);

  // ✅ โหลดหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      setFutureDiscovery(j.results || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  // ✅ แสดงหน้าเหมาะสมกับสถานะ
  if (stage === "loading") return null;

  if (stage === "register")
    return <Reister onRegister={() => setStage("vip")} goVip={() => setStage("app")} />;

  if (stage === "vip")
    return <VipPae onVIP={() => setStage("app")} />;

  // ✅ แอปจริงหลังผ่าน VIP
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
              setFavorites(prev =>
                prev.includes(sym)
                  ? prev.filter((x) => x !== sym)
                  : [...prev, sym]
              )
            }
          />
        );

      case "scanner":
        return <ScannerSwitcher />;

      case "settings":
        return <SettinMenu />;

      default:
        return <MarketSection />;
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      <nav className="fixed bottom-3 left-3 right-3 bg-[#0b1220]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-around text-gray-400 text-[12px] font-bold uppercase py-3 shadow-lg shadow-black/40 tracking-widest">
        {[
          { id: "favorites", label: "Favorites" },
          { id: "market", label: "OriginX" },
          { id: "scanner", label: "Scanner" },
          { id: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`transition-all px-2 ${
              active === t.id
                ? "text-emerald-400 border-b-2 border-emerald-400 pb-1"
                : "text-gray-400 hover:text-emerald-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
          }
