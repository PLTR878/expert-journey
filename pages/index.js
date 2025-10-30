// pages/index.js
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSection from "../components/ScannerSection";
import SettinMenu from "../components/SettinMenu";
import LoinPaex from "../components/LoinPaex";
import ReisterPae from "../components/ReisterPae";
import VipReister from "../components/VipReister";
import {
  getCurrentUser,
  getPaidStatus,
  getUserData,
  setUserData,
} from "../utils/authStore";

export default function Home() {
  const [active, setActive] = useState("register");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [paid, setPaid] = useState(false);

  // โหลด user ตอนเริ่ม
  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setPaid(getPaidStatus());
    if (u) setFavorites(getUserData(u, "favorites", []));
  }, []);

  // โหลดข้อมูลตลาด
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
        const j = await res.json();
        setFutureDiscovery(j.results || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // เมื่อ favorites เปลี่ยน → บันทึกลง localStorage ตาม user
  useEffect(() => {
    if (user) setUserData(user, "favorites", favorites);
  }, [favorites, user]);

  const go = (tab) => {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLocked = !user;

  const renderPage = () => {
    if (isLocked) {
      if (active === "login") return <LoinPaex go={go} onAuth={(u) => { setUser(u); go("vip"); }} />;
      return <ReisterPae go={go} />;
    }
    if (!paid) return <VipReister go={go} onPaid={() => { setPaid(true); go("market"); }} />;

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
        return <ScannerSection />;
      case "settings":
        return <SettinMenu />;
      default:
        return <MarketSection />;
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {!isLocked && paid && (
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
      )}
    </main>
  );
              }
