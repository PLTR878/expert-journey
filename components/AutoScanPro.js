// ✅ components/AutoScanPro.js (with Live Progress + Sound Alert)
import { useState, useEffect } from "react";

export default function AutoScanPro() {
  const [mode, setMode] = useState("short");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [results, setResults] = useState([]);

  const modeName = {
    short: "⚡ เทรดสั้น (1–7 วัน)",
    swing: "📈 Swing (2–6 สัปดาห์)",
    long: "💎 ลงทุนยาว (3–6 เดือน)",
  };

  const colorClass = {
    short: "text-emerald-400",
    swing: "text-yellow-400",
    long: "text-sky-400",
  };

  // ✅ ระบบเสียงเตือนเมื่อสแกนเสร็จ
  function playDing() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  }

  // 🔍 ฟังก์ชันสแกนหุ้น
  async function scan(mode = "short") {
    setLoading(true);
    setProgress(0);
    setStatus("📡 เริ่มต้นสแกนข้อมูลหุ้น...");
    try {
      const r = await fetch(`/api/screener?limit=300`);
      const j = await r.json();
      const all = j.results || [];
      const total = all.length;
      const filtered = [];

      for (let i = 0; i < total; i++) {
        const s = all[i];
        const p = s.price || 0;
        const ema20 = s.ema20 || 0;
        const ema50 = s.ema50 || 0;
        const ema200 = s.ema200 || 0;
        const rsi = s.rsi || 0;
        const hist = s.macd?.hist || 0;
        const conf = s.confidence || 0;

        // 🎯 เงื่อนไขแต่ละโหมด
        let match = false;
        if (mode === "short") {
          match =
            p >= 2 &&
            p <= 45 &&
            ema20 > ema50 &&
            rsi > 45 &&
            rsi < 65 &&
            hist > -0.1 &&
            conf >= 0.5;
        }
        if (mode === "swing") {
          match =
            p >= 3 &&
            p <= 80 &&
            ema20 > ema50 &&
            rsi > 45 &&
            rsi < 75 &&
            conf >= 0.5;
        }
        if (mode === "long") {
          match = ema50 > ema200 && rsi > 50 && conf >= 0.5 && p > ema200;
        }
        if (match) filtered.push(s);

        // อัปเดต progress ทุก ๆ 10 หุ้น
        if (i % 10 === 0) {
          setProgress(Math.round(((i + 1) / total) * 100));
          setStatus(`🧠 กำลังประมวลผล... (${i + 1}/${total})`);
          await new Promise((res) => setTimeout(res, 10));
        }
      }

      setResults(filtered);
      setProgress(100);
      if (filtered.length > 0) {
        setStatus(`✅ พบหุ้นเข้าเกณฑ์ ${filtered.length} ตัว`);
      } else {
        setStatus("❌ ยังไม่พบหุ้นเข้าเกณฑ์ในตอนนี้");
      }
      playDing();
    } catch (e) {
      console.error(e);
      setStatus("❗ เกิดข้อผิดพลาดในการสแกน");
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

      {/* 🔄 ปุ่มสแกนใหม่ */}
      <button
        onClick={() => scan(mode)}
        disabled={loading}
        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm px-3 py-1.5 rounded-lg border border-emerald-400/30 mb-3"
      >
        {loading ? "⏳ กำลังสแกน..." : "🔄 Re-Scan Now"}
      </button>

      {/* 📊 แถบสถานะการสแกน */}
      <div className="mb-3">
        <div className="w-full bg-[#141b2d] h-2 rounded-full overflow-hidden mb-1">
          <div
            className="h-2 bg-emerald-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-400">{status}</div>
      </div>

      {/* 📈 ผลลัพธ์การสแกน */}
      {results.length === 0 ? (
        <div className="text-gray-400 text-sm mt-2">
          ยังไม่พบหุ้นเข้าเกณฑ์ในตอนนี้
        </div>
      ) : (
        <div className="space-y-2 mt-2">
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
