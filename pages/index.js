import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSwitcher from "../components/ScannerSwitcher";
import SettinMenu from "../components/SettinMenu";
import Reister from "../components/Reister";   // ✅
import VipPae from "../components/VipPae";     // ✅

export default function Home() {
  const [active, setActive] = useState("reister");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [optionAI, setOptionAI] = useState(null);
  const [loading, setLoading] = useState(false);

  const go = (tab) => {
    setActive(tab);
    localStorage.setItem("lastActiveTab", tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const savedTab = localStorage.getItem("lastActiveTab");
    if (savedTab) setActive(savedTab);
  }, []);

  const renderPage = () => {
    if (!localStorage.getItem("USER_DATA")) return <Reister onDone={() => go("vip")} />;
    if (!localStorage.getItem("vip")) return <VipPae onSuccess={() => go("market")} />;

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
                prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
              )
            }
          />
        );
      case "scan":
        return <ScannerSwitcher optionAI={optionAI} />;
      case "vip":
        return <VipPae onSuccess={() => go("market")} />;
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
          { id: "scan", label: "Scanner" },
          { id: "vip", label: "VIP" },
          { id: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
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
