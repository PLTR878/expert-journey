// ✅ components/AutoScanPro.js
import { useState, useEffect } from "react";

export default function AutoScanPro() {
  const [mode, setMode] = useState("short");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const modeName = {
    short: "⚡ เทรดสั้น (1–7 วัน)",
    swing: "📈 Swing (2–6 สัปดาห์)",
    long: "💎 ลงทุนยาว (3–6 เดือน)"
  };

  const colorClass = {
    short: "text-emerald-400",
    swing: "text-yellow-400",
    long: "text-sky-400"
  };

  // 🔍 สแกนหุ้นตามโหมด
  async function scan(mode = "short") {
    setLoading(true);
    try {
      const r = await fetch(`/api/screener?limit=300`);
      const j = await r.json();
      const all = j.results || [];

      const filtered = all.filter((s) => {
        const p = s.price || 0;
        const ema20 = s.ema20 || 0;
        const ema50 = s.ema50 || 0;
        const ema200 = s.ema200 || 0;
        const rsi = s.rsi || 0;
        const hist = s.macd?.hist || 0;
        const conf = s.confidence || 0;

        // 🎯 เงื่อนไขแต่ละโหมด
        if (mode === "short") {
          return (
            p >= 3 && p <= 25 &&
            ema20 > ema50 &&
            rsi > 48 && rsi < 60 &&
            hist > 0 &&
            conf >= 0.65
          );
        }
        if (mode === "swing") {
          return (
            p >= 5 && p <= 45 &&
            ema20 > ema50 && ema50 > ema200 &&
            rsi >= 55 && rsi <= 65 &&
            hist > 0 &&
            conf >= 0.6
          );
        }
        if (mode === "long") {
          return (
            ema50 > ema200 &&
            rsi > 50 &&
            conf >= 0.55 &&
            p > ema200
          );
        }
        return false;
      });

      setResults(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scan(mode);
  }, [mode]);

  return (
    <section className="bg-[#0b1220] border border-white/10 rounded-2xl p-4 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        🤖 AI Multi-Mode Market Scanner
      </h2>

      {/* 🔘 ปุ่มเลือกโหมด */}
      <div className="flex justify-around mb-4">
        {["short", "swing", "long"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-sm border border-white/10 transition-all duration-300 ${
              mode === m
                ? `${colorClass[m]} bg-white/10 border-white/20 font-bold`
                : "text-gray-400 hover:text-white hover:border-white/30"
            }`}
          >
            {modeName[m]}
          </button>
        ))}
      </div>

      <button
        onClick={() => scan(mode)}
        disabled={loading}
        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm px-3 py-1.5 rounded-lg border border-emerald-400/30 mb-3"
      >
        {loading ? "⏳ กำลังสแกน..." : "🔄 Re-Scan Now"}
      </button>

      {results.length === 0 ? (
        <div className="text-gray-400 text-sm">ไม่พบหุ้นที่เข้าเกณฑ์ในตอนนี้</div>
      ) : (
        <div className="space-y-2">
          {results.map((s, i) => (
            <div
              key={i}
              className="flex justify-between items-center border border-white/10 rounded-xl px-3 py-2 bg-[#141b2d] hover:border-emerald-400/30 transition"
            >
              <span className="text-white font-semibold">{s.symbol}</span>
              <span className="text-gray-300">${s.price?.toFixed(2) || "-"}</span>
              <span
                className={`font-bold text-sm ${
                  mode === "short"
                    ? "text-emerald-400"
                    : mode === "swing"
                    ? "text-yellow-400"
                    : "text-sky-400"
                }`}
              >
                {mode === "short"
                  ? "🔥 Short-Term Buy"
                  : mode === "swing"
                  ? "📈 Swing Buy"
                  : "💎 Long Hold"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
            }
