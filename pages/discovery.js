// ✅ Visionary AI Discovery — หน้า AI หาหุ้นต้นน้ำ
import { useEffect, useState } from "react";

export default function Discovery() {
  const [loading, setLoading] = useState(false);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((prev) => [...prev.slice(-20), `${new Date().toLocaleTimeString()} ${msg}`]);

  // ✅ โหลดข้อมูลหุ้นต้นน้ำ
  async function loadDiscovery() {
    try {
      setLoading(true);
      addLog("🧠 AI scanning for hidden opportunities...");
      const res = await fetch(`/api/visionary-eternal?type=ai-discovery`);
      const json = await res.json();
      if (json.discovered && json.discovered.length) {
        setHiddenGems(json.discovered);
        addLog(`✅ ${json.discovered.length} stocks discovered`);
      } else {
        addLog("⚠️ No discovery data received");
      }
    } catch (err) {
      addLog("❌ Failed to fetch discovery data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16 px-3 pt-4">
      <h1 className="text-[18px] font-bold text-emerald-400 mb-3">
        🌋 AI Hidden Discovery (ต้นน้ำ อนาคตไกล)
      </h1>

      {loading && (
        <p className="text-gray-400 text-[13px]">AI กำลังวิเคราะห์หุ้นต้นน้ำ...</p>
      )}

      {!loading && hiddenGems.length === 0 && (
        <p className="text-gray-500 italic text-[13px]">
          ไม่มีข้อมูลหุ้นในตอนนี้ — กรุณาลองใหม่อีกครั้ง
        </p>
      )}

      {/* ✅ แสดงหุ้นที่ AI เจอ */}
      <div className="mt-3 space-y-2">
        {hiddenGems.map((s, i) => (
          <div
            key={i}
            className="flex justify-between bg-[#0f172a]/70 p-2.5 rounded-lg border border-gray-800 hover:border-emerald-400/40 transition-all"
          >
            <div>
              <h3 className="text-[15px] font-bold text-white">{s.symbol}</h3>
              <p className="text-[12px] text-gray-400">{s.name || "AI discovered candidate"}</p>
            </div>
            <a
              href={`/analyze/${s.symbol}`}
              className="text-emerald-400 text-[13px] font-medium hover:underline"
            >
              View
            </a>
          </div>
        ))}
      </div>

      {/* Logs */}
      <section className="mt-6">
        <button
          onClick={() => setLogs([])}
          className="text-[12px] text-emerald-400 border border-emerald-400/30 rounded-md px-2 py-1 hover:bg-emerald-500/10"
        >
          Clear Logs
        </button>

        <div className="mt-2 bg-[#111827]/70 border border-gray-800 rounded-lg p-3 text-[12px] text-gray-400 max-h-[35vh] overflow-auto">
          {logs.length ? (
            logs.map((l, i) => <div key={i}>{l}</div>)
          ) : (
            <p className="text-gray-500 italic">No logs yet.</p>
          )}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-[#0b1220]/95 text-center text-gray-400 text-[12px] py-2">
        Visionary AI Discovery v1.0
      </footer>
    </main>
  );
        }
