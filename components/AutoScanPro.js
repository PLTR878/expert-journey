// ✅ AutoScanPro.js — Full Market Scanner (Ultimate Version)
import { useState, useEffect } from "react";

export default function AutoScanPro() {
  const [mode, setMode] = useState("short");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [results, setResults] = useState([]);
  const [batch, setBatch] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);

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

  // ✅ เล่นเสียงตอนสแกนเสร็จ
  function playDing() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  // ✅ สแกนหุ้นทั้งตลาดแบบแบ่ง batch
  async function fullScan(mode = "short") {
    setLoading(true);
    setProgress(0);
    setStatus("📡 เริ่มสแกนหุ้นทั้งตลาดอเมริกา...");
    setResults([]);
    setBatch(0);
    setTotalScanned(0);

    const LIMIT = 300;
    const TOTAL = 6000; // หุ้นทั้งหมดประมาณ 6,000 ตัว
    const allResults = [];

    try {
      for (let offset = 0; offset < TOTAL; offset += LIMIT) {
        const batchNo = offset / LIMIT + 1;
        setBatch(batchNo);
        setStatus(`🧠 กำลังสแกนชุดที่ ${batchNo} (${offset + 1}-${offset + LIMIT})...`);
        const r = await fetch(`/api/screener?limit=${LIMIT}&offset=${offset}`);
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

          if (mode === "short") {
            return p >= 2 && p <= 45 && ema20 > ema50 && rsi > 45 && rsi < 65 && hist > -0.1 && conf >= 0.5;
          }
          if (mode === "swing") {
            return p >= 3 && p <= 80 && ema20 > ema50 && rsi > 45 && rsi < 75 && conf >= 0.5;
          }
          if (mode === "long") {
            return ema50 > ema200 && rsi > 50 && conf >= 0.5 && p > ema200;
          }
          return false;
        });

        allResults.push(...filtered);
        setTotalScanned(offset + all.length);
        setProgress(Math.min(100, Math.round(((offset + LIMIT) / TOTAL) * 100)));
        await new Promise((r) => setTimeout(r, 300)); // ชะลอให้เหมือนจริง
      }

      setResults(allResults);
      setProgress(100);
      setStatus(`✅ สแกนครบทั้งหมด ${TOTAL} ตัว พบหุ้นเข้าเกณฑ์ ${allResults.length} ตัว`);
      playDing();
    } catch (e) {
      console.error(e);
      setStatus("⚠️ เกิดข้อผิดพลาดระหว่างสแกนตลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fullScan(mode);
  }, [mode]);

  return (
    <section className="bg-[#0b1220] border border-white/10 rounded-2xl p-4 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        🤖 AI Full Market Scanner (6,000+ หุ้น)
      </h2>

      {/* โหมด */}
      <div className="flex justify-around mb-4">
        {["short", "swing", "long"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={loading}
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
        onClick={() => fullScan(mode)}
        disabled={loading}
        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm px-3 py-1.5 rounded-lg border border-emerald-400/30 mb-3"
      >
        {loading ? "⏳ กำลังสแกนทั้งตลาด..." : "🔄 สแกนตลาดทั้งหมด"}
      </button>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-[#141b2d] h-2 rounded-full overflow-hidden mb-1">
          <div
            className="h-2 bg-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-400">{status}</div>
      </div>

      {/* สรุปผล */}
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
