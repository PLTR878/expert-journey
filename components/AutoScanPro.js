// ✅ AutoScanPro.js — Full Market Scanner (Ultimate Hybrid Galaxy Edition)
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

  // 🔔 เสียงเตือนเมื่อสแกนเสร็จ
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

  // 🚀 ฟังก์ชันสแกนหุ้นทั้งตลาด (ต่อกับ screener-hybrid.js)
  async function fullScan(mode = "short") {
    setLoading(true);
    setProgress(0);
    setStatus("📡 เริ่มสแกนหุ้นทั้งตลาดอเมริกา...");
    setResults([]);

    try {
      const r = await fetch(`/api/screener-hybrid?mode=${mode}`);
      if (!r.ok) throw new Error("API error");
      const reader = r.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;

        // ✅ อัปเดตสถานะตาม log ที่ API ส่งมา (แบบ streaming)
        const lines = chunk.split("\n").filter(Boolean);
        for (let line of lines) {
          try {
            const msg = JSON.parse(line);
            if (msg.progress) setProgress(msg.progress);
            if (msg.log) setStatus(msg.log);
            if (msg.results) setResults(msg.results);
          } catch {
            // ถ้าไม่ใช่ JSON ให้ข้าม
          }
        }
      }

      setStatus("✅ สแกนเสร็จสมบูรณ์ — ข้อมูลอัปเดตจากตลาดจริง");
      setProgress(100);
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

      {/* ปุ่มเลือกโหมด */}
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

      {/* Progress */}
      <div className="mb-3">
        <div className="w-full bg-[#141b2d] h-2 rounded-full overflow-hidden mb-1">
          <div
            className="h-2 bg-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-400">{status}</div>
      </div>

      {/* ผลลัพธ์ */}
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
              <span className="text-gray-300">
                ${s.price?.toFixed?.(2) || "-"}
              </span>
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
