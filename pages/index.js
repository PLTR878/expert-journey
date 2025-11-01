// ✅ /pages/index.js — Visionary Home (Smart Loader + Compact UI + Option AI Linked)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSwitcher from "../components/ScannerSwitcher";
import SettinMenu from "../components/SettinMenu";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [optionAI, setOptionAI] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ โหลดแท็บล่าสุดจาก localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("lastActiveTab");
    if (savedTab) setActive(savedTab);
  }, []);

  // ✅ จำแท็บล่าสุดทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem("lastActiveTab", active);
  }, [active]);

  // ✅ โหลดข้อมูลหุ้นต้นน้ำ (Visionary Batch)
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

  // ✅ โหลดข้อมูล Option AI (เพื่อใช้ในหน้า Scanner หรือ Market)
  async function loadOptionAI() {
    try {
      const res = await fetch("/api/visionary-option-ai?symbol=PLTR"); // ทดลองโหลดหุ้นหนึ่งตัวเพื่อ warmup
      const j = await res.json();
      setOptionAI(j);
    } catch (err) {
      console.error("⚠️ Option AI load error:", err);
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

  // ✅ บันทึก Favorites กลับเข้า localStorage
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("❌ Save favorites error:", e);
    }
  }, [favorites]);

  // ✅ เปลี่ยนแท็บ
  const go = (tab) => {
    setActive(tab);
    localStorage.setItem("lastActiveTab", tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ แสดงเนื้อหาหลัก
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
        return <SettinMenu />;
      default:
        return <MarketSection />;
    }
  };

  // ✅ Layout หลัก
  return (
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* ✅ แถบเมนูด้านล่าง */}
      <nav className="fixed bottom-3 left-3 right-3 bg-[#0b1220]/95 backdrop-blur-md border border-white/10 rounded-2xl flex justify-around text-gray-400 text-[12px] font-bold uppercase py-3 shadow-lg shadow-black/40 tracking-widest">
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
