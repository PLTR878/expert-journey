// ✅ /pages/index.js — Visionary Home (AI Linked + Twelve Data)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSwitcher from "../components/ScannerSwitcher";
import SettinMenu from "../components/SettinMenu"; // ✅ หน้าใหม่ของ AI

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [optionAI, setOptionAI] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ โหลดแท็บล่าสุดที่เปิดไว้
  useEffect(() => {
    const saved = localStorage.getItem("lastActiveTab");
    if (saved) setActive(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lastActiveTab", active);
  }, [active]);

  // ✅ โหลดหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      setFutureDiscovery(j.results || []);
    } catch (err) {
      console.error("❌ Discovery load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ โหลดข้อมูลจาก AI ใหม่ (Twelve Data + GPT)
  async function loadOptionAI() {
    try {
      const res = await fetch("/api/ai-visionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "PLTR",
          prompt: "แนวโน้มสัปดาห์นี้",
        }),
      });
      const j = await res.json();
      if (j.success) {
        setOptionAI(j);
        console.log("✅ Visionary AI Response:", j);
      } else {
        console.warn("⚠️ Visionary AI Error:", j.error);
      }
    } catch (err) {
      console.error("❌ Visionary AI load error:", err);
    }
  }

  useEffect(() => {
    loadDiscovery();
    loadOptionAI();
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

  // ✅ บันทึก Favorites ลง localStorage
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("❌ Save favorites error:", e);
    }
  }, [favorites]);

  const go = (tab) => {
    setActive(tab);
    localStorage.setItem("lastActiveTab", tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ จัดการสลับหน้า
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
        return <ScannerSwitcher optionAI={optionAI} />;
      case "settings":
        return <SettinMenu />; // ✅ หน้า AI Trade
      default:
        return <MarketSection />;
    }
  };

  // ✅ ส่วนแสดงผลหลัก
  return (
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* ✅ เมนูด้านล่าง */}
      <nav className="fixed bottom-3 left-3 right-3 bg-[#0b1220]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-around text-gray-400 text-[12px] font-bold uppercase py-3 shadow-lg shadow-black/40 tracking-widest">
        {[
          { id: "favorites", label: "Favorites" },
          { id: "market", label: "OriginX" },
          { id: "scan", label: "Scanner" },
          { id: "settings", label: "AI Trade" },
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
