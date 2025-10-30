// ✅ OriginX — Smart Auth Flow (Register → Login → Market if VIP)
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
  setPaidStatus,
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

  // โหลดสถานะตอนเริ่ม
  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    const p = getPaidStatus();
    setPaid(p);

    if (u) {
      const fav = getUserData(u, "favorites", []);
      setFavorites(fav);
      // ✅ ถ้าผู้ใช้เคยสมัครแล้ว เข้า Market เลย
      setActive(p ? "market" : "vip");
    } else {
      setActive("register");
    }
  }, []);

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

  // บันทึก Favorites แยกตาม user
  useEffect(() => {
    if (user) setUserData(user, "favorites", favorites);
  }, [favorites, user]);

  // ฟังก์ชันเปลี่ยนหน้า
  const go = (tab) => {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ เมื่อสมัคร/เข้าสู่ระบบสำเร็จ
  const handleAuth = (u) => {
    setUser(u);
    const p = getPaidStatus();
    setPaid(p);
    const fav = getUserData(u, "favorites", []);
    setFavorites(fav);
    // ถ้า VIP แล้ว ไป Market ทันที
    go(p ? "market" : "vip");
  };

  // ✅ หลังจากกดสมัคร VIP แล้ว
  const handlePaid = () => {
    setPaidStatus(true);
    setPaid(true);
    go("market"); // ไปหน้า Market โดยตรง
  };

  const isLocked = !user;

  const renderPage = () => {
    // ยังไม่ได้ล็อกอิน → แสดง login/register เท่านั้น
    if (isLocked) {
      if (active === "login") return <LoinPaex go={go} onAuth={handleAuth} />;
      return <ReisterPae go={go} />;
    }

    // ถ้ายังไม่ได้ VIP → แสดงสมัครครั้งเดียว
    if (!paid && active === "vip") {
      return <VipReister go={go} onPaid={handlePaid} />;
    }

    // เข้าหน้า app ได้
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

      {/* ✅ Bottom Nav เฉพาะเมื่อ VIP แล้วเท่านั้น */}
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
