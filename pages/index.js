// ✅ OriginX — Stable Multi-User VIP (FirebaseX Connected + Final Version)
import { useState, useEffect } from "react";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSection from "../components/ScannerSection";
import SettinMenuX from "../components/SettinMenuX";
import LoinPageX from "../components/LoinPageX";
import ReisterPageX from "../components/ReisterPageX";
import VipReister from "../components/VipReister";
import { auth, db, observeUser } from "../lib/FirebaseX"; // ✅ ใช้ FirebaseX ใหม่แทนระบบจำลองเดิม
import { getDoc, doc, setDoc } from "firebase/firestore";

export default function Home() {
  const [active, setActive] = useState("login");
  const [favorites, setFavorites] = useState([]);
  const [futureDiscovery, setFutureDiscovery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [paid, setPaid] = useState(false);

  // ✅ โหลดสถานะผู้ใช้ Firebase ตอนเริ่ม
  useEffect(() => {
    const unsubscribe = observeUser(async (u) => {
      setUser(u);
      if (u) {
        // โหลดสถานะ VIP จาก Firestore
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        setPaid(data?.vip === true);
        setFavorites(data?.favorites || []);
        setActive(data?.vip ? "market" : "vip");
      } else {
        setActive("login");
      }
    });
    return () => unsubscribe();
  }, []);

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

  // ✅ บันทึก favorites แยกต่อ user ลง Firestore
  useEffect(() => {
    async function saveFavs() {
      if (user && user.uid) {
        const ref = doc(db, "users", user.uid);
        await setDoc(ref, { favorites }, { merge: true });
      }
    }
    saveFavs();
  }, [favorites, user]);

  // ✅ เปลี่ยนหน้า
  const go = (tab) => {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ เมื่อ login / register สำเร็จ
  const handleAuth = (u) => {
    setUser(u);
    go("vip");
  };

  // ✅ เมื่อสมัคร VIP สำเร็จ
  const handlePaid = async () => {
    if (!user || !user.uid) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { vip: true }, { merge: true });
    setPaid(true);
    go("market");
  };

  // ✅ Render หน้า
  const renderPage = () => {
    if (!user) {
      if (active === "login") return <LoinPageX go={go} onAuth={handleAuth} />;
      return <ReisterPageX go={go} onAuth={handleAuth} />;
    }

    // ถ้ายังไม่ได้ VIP → หน้า VIP Register
    if (!paid && active === "vip") {
      return <VipReister go={go} onPaid={handlePaid} />;
    }

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
        return <SettinMenuX />;
      default:
        return <MarketSection />;
    }
  };

  // ✅ Layout
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-24">
      <div className="max-w-6xl mx-auto px-3 pt-3">{renderPage()}</div>

      {/* ✅ Bottom Nav เฉพาะ VIP */}
      {user && paid && (
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
