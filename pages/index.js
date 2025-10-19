// ✅ Visionary AI Discovery — V∞.11 (Hidden Gems + Bottom Navigation)
import { useEffect, useState } from "react";

export default function Home() {
  const [active, setActive] = useState("ai"); // เริ่มต้นหน้า AI Discovery
  const [discoveries, setDiscoveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((p) => [...p.slice(-30), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ โหลดข้อมูลหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      addLog("🧠 AI scanning for early-stage opportunities...");
      const res = await fetch(`/api/visionary-eternal?type=ai-discovery`);
      const j = await res.json();

      if (j?.discovered?.length) {
        setDiscoveries(j.discovered);
        addLog(`✅ Found ${j.discovered.length} future leaders`);
      } else {
        addLog("⚠️ No discoveries found");
      }
    } catch (err) {
      addLog("❌ Failed to fetch AI data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscovery();
    const timer = setInterval(loadDiscovery, 120000); // รีเฟรชทุก 2 นาที
    return () => clearInterval(timer);
  }, []);

  // ===== UI =====
  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-20">
      {/* ✅ แสดงเฉพาะหน้า AI Discovery */}
      {active === "ai" && (
        <div className="max-w-6xl mx-auto px-3 pt-4">
          <h1 className="text-emerald-400 text-[18px] font-bold mb-2">
            🌋 AI Hidden Discovery — หุ้นต้นน้ำ อนาคตไกล
          </h1>
          <p className="text-gray-400 text-[13px] mb-3">
            AI วิเคราะห์หุ้นระยะยาวที่ยังไม่มีใครเห็น แต่มีศักยภาพเติบโตสูง
          </p>

          {loading && <p className="text-gray-500 text-[13px] italic">AI กำลังสแกนตลาด...</p>}

          {/* ✅ แสดงหุ้นที่ค้นพบ */}
          <div className="mt-3 space-y-2">
            {discoveries.map((d, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-[#111827]/70 p-3 rounded-lg border border-gray-800 hover:border-emerald-400/40 transition-all"
              >
                <div>
                  <h2 className="text-[15px] font-bold text-white">{d.symbol}</h2>
                  <p className="text-[12px] text-gray-400">{d.name || "AI Discovery Candidate"}</p>
                </div>
                <a
                  href={`/analyze/${d.symbol}`}
                  className="text-emerald-400 text-[13px] hover:underline"
                >
                  View
                </a>
              </div>
            ))}

            {!loading && discoveries.length === 0 && (
              <p className="text-gray-500 italic text-[13px]">ไม่มีข้อมูลในขณะนี้</p>
            )}
          </div>

          {/* 🧠 Logs */}
          <section className="mt-6">
            <button
              onClick={() => setLogs([])}
              className="border border-emerald-400/40 text-emerald-400 rounded-md px-2 py-1 text-[12px] hover:bg-emerald-500/10"
            >
              Clear Logs
            </button>
            <div className="mt-2 bg-[#141b2d]/70 rounded-md border border-gray-800 p-2 text-[11px] text-gray-400 max-h-44 overflow-auto">
              {logs.length ? (
                logs.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <p className="text-gray-500 italic">No logs yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ✅ Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/5 flex justify-around text-gray-400 text-[11px] z-50">
        {[
          { id: "favorites", label: "Favorites", icon: "💙" },
          { id: "market", label: "Market", icon: "🌐" },
          { id: "scan", label: "Scanner", icon: "📡" },
          { id: "ai", label: "AI Trade", icon: "🤖" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`py-1 flex flex-col items-center ${
              active === t.id ? "text-emerald-400" : ""
            }`}
          >
            <span className="text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  );
              }
