// ✅ AutoScanPro.js — Galactic AI Full Market Scanner
import { useState, useEffect } from "react";

export default function AutoScanPro() {
  const [mode, setMode] = useState("short");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [progress, setProgress] = useState(0);

  const modes = {
    short: "⚡ เทรดสั้น (1–7 วัน)",
    swing: "📈 Swing (2–6 สัปดาห์)",
    long: "💎 ลงทุนยาว (3–6 เดือน)",
  };

  async function scan(m = "short") {
    setLoading(true);
    setResults([]);
    setStatus("🔍 กำลังสแกนตลาดทั้งหมด...");
    setProgress(15);

    try {
      const r = await fetch(`/api/screener-hybrid?mode=${m}`);
      const j = await r.json();
      setProgress(70);
      if (j.results?.length) {
        setResults(j.results);
        setStatus(`✅ พบหุ้นเข้าเกณฑ์ ${j.results.length} ตัว`);
      } else {
        setStatus("⚠️ ยังไม่พบหุ้นเข้าเกณฑ์ในตอนนี้");
      }
    } catch (e) {
      setStatus("❌ เกิดข้อผิดพลาดในการสแกนตลาด");
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }

  useEffect(() => {
    scan(mode);
  }, [mode]);

  return (
    <section className="bg-[#0b1220] border border-white/10 rounded-2xl p-4 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-white">
        🤖 AI Galactic Market Scanner
      </h2>

      <div className="flex justify-around mb-4">
        {Object.keys(modes).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-sm border border-white/10 transition-all duration-300 ${
              mode === m
                ? "bg-white/10 border-emerald-400 text-emerald-400"
                : "text-gray-400 hover:text-white hover:border-white/30"
            }`}
          >
            {modes[m]}
          </button>
        ))}
      </div>

      <button
        onClick={() => scan(mode)}
        disabled={loading}
        className="bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 text-sm px-3 py-2 rounded-lg border border-emerald-400/30 mb-3"
      >
        {loading ? "⏳ สแกนตลาด..." : "🔄 Re-Scan Now"}
      </button>

      <div className="w-full bg-[#141b2d] h-2 rounded-full overflow-hidden mb-2">
        <div
          className="h-2 bg-emerald-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-xs text-gray-400 mb-3">{status}</div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((s, i) => (
            <div
              key={i}
              className="flex justify-between items-center border border-white/10 rounded-xl px-3 py-2 bg-[#141b2d] hover:border-emerald-400/30"
            >
              <span className="text-white font-semibold">{s.symbol}</span>
              <span className="text-gray-300">${s.price?.toFixed(2)}</span>
              <span
                className={`font-bold ${
                  mode === "short"
                    ? "text-emerald-400"
                    : mode === "swing"
                    ? "text-yellow-400"
                    : "text-sky-400"
                }`}
              >
                Buy
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
