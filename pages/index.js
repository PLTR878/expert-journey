// ✅ /pages/index.js — Visionary Home (Full Linked: OriginX + OptionX + AI Core)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import SettinMenu from "../components/SettinMenu";

export default function Home() {
  const [active, setActive] = useState("market");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionResult, setOptionResult] = useState(null);
  const [scanSymbol, setScanSymbol] = useState("");

  // ✅ โหลดแท็บล่าสุดจาก localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("lastActiveTab");
    if (savedTab) setActive(savedTab);
  }, []);

  // ✅ จำแท็บล่าสุด
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
      console.error("Discovery load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDiscovery(); }, []);

  // ✅ โหลด Favorites จาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // ✅ บันทึก Favorites
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ Scanner (OptionX + Visionary Core)
  async function handleScan() {
    if (!scanSymbol) return alert("⚠️ ใส่ชื่อหุ้นก่อน เช่น PLTR");
    setLoading(true);
    try {
      // 1️⃣ เรียก Visionary Core (RSI / EMA / Trend)
      const coreRes = await fetch(`/api/visionary-core?symbol=${scanSymbol}`);
      const core = await coreRes.json();

      // 2️⃣ เรียก OptionX Analyzer (Option Data)
      const optRes = await fetch(`/api/optionx-analyzer?symbol=${scanSymbol}`);
      const opt = await optRes.json();

      setOptionResult({ core, opt });
    } catch (e) {
      alert("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ ฟังก์ชันเปลี่ยนแท็บ
  const go = (tab) => {
    setActive(tab);
    localStorage.setItem("lastActiveTab", tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ หน้าหลักแต่ละแท็บ
  const renderPage = () => {
    switch (active) {
      case "favorites":
        return <Favorites favorites={favorites} setFavorites={setFavorites} />;

      case "market":
        return (
          <MarketSection
            title="🚀 OriginX (AI Discovery)"
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
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold text-emerald-400 mb-4">
              🧠 AI Trade & Option Scanner
            </h1>

            <div className="flex gap-2 mb-4">
              <input
                className="bg-[#141a2b] p-2 rounded-md flex-1 outline-none text-white"
                placeholder="เช่น PLTR, SOUN, RXRX..."
                value={scanSymbol}
                onChange={(e) => setScanSymbol(e.target.value.toUpperCase())}
              />
              <button
                onClick={handleScan}
                className="bg-emerald-500 hover:bg-emerald-600 px-4 rounded-md"
              >
                {loading ? "🔍 กำลังสแกน..." : "SCAN"}
              </button>
            </div>

            {optionResult && (
              <div className="bg-[#141a2b] p-4 rounded-lg">
                <h2 className="text-lg text-emerald-400 mb-2">
                  ผลลัพธ์ ({optionResult.core?.symbol})
                </h2>
                <p>ราคาหุ้น: ${optionResult.core?.lastClose}</p>
                <p>RSI: {optionResult.core?.rsi}</p>
                <p>แนวโน้ม: {optionResult.core?.trend}</p>
                <p>สัญญาณ: {optionResult.core?.signal}</p>

                <hr className="my-3 border-gray-600" />

                <h3 className="text-pink-400 mb-2">Option Calls (Top)</h3>
                {optionResult.opt?.calls?.map((o, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>Strike {o.strike}</span>
                    <span>${o.last} | ROI {o.roi}%</span>
                  </div>
                ))}

                <h3 className="text-pink-400 mt-4 mb-2">Option Puts (Top)</h3>
                {optionResult.opt?.puts?.map((o, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>Strike {o.strike}</span>
                    <span>${o.last} | ROI {o.roi}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

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
