import { useState, useEffect } from "react";
import Reister from "../components/Reister";
import VipPae from "../components/VipPae";
import MarketSection from "../components/MarketSection";
import Favorites from "../components/Favorites";
import ScannerSwitcher from "../components/ScannerSwitcher";
import SettinMenu from "../components/SettinMenu";

export default function Home() {
  const [stage, setStage] = useState("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const name = localStorage.getItem("username");
    const vip = localStorage.getItem("vip");

    if (!name) setStage("register");
    else if (vip !== "yes") setStage("vip");
    else setStage("app");
  }, []);

  if (stage === "loading") return null;
  if (stage === "register") return <Reister onRegister={() => setStage("vip")} />;
  if (stage === "vip") return <VipPae onVIP={() => setStage("app")} />;

  // ✅ ถ้า VIP ผ่าน → เข้าแอป
  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <MarketSection />
    </main>
  );
    }
