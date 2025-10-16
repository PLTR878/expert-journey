// ---------- ✅ ระบบสแกนหุ้นอเมริกาทั้งตลาด (AutoMarketScan) ----------
import { useEffect as useEff2, useState as useSt2 } from "react";

export default function AutoMarketScan() {
  const [enabled, setEnabled] = useSt2(false);
  const [aiSignal, setAiSignal] = useSt2("Buy");
  const [rsiMin, setRsiMin] = useSt2("");
  const [rsiMax, setRsiMax] = useSt2("");
  const [priceMin, setPriceMin] = useSt2("");
  const [priceMax, setPriceMax] = useSt2("");
  const [scanProg, setScanProg] = useSt2(0);
  const [hits, setHits] = useSt2([]);
  const [messages, setMessages] = useSt2([]);
  const [scanning, setScanning] = useSt2(false);

  // 🔔 เสียง beep เวลาพบหุ้นที่เข้าเงื่อนไข
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    } catch (err) {
      console.warn("beep error", err);
    }
  };

  // 🚀 ฟังก์ชันสแกนหุ้นทั้งหมดผ่าน /api/scan
  const runScan = async () => {
    if (!enabled || scanning) return;
    setScanning(true);
    setScanProg(0);
    setHits([]);
    setMessages([]);
    try {
      const url = `/api/scan?mode=${aiSignal}&rsiMin=${rsiMin || 0}&rsiMax=${rsiMax || 100}&priceMin=${priceMin || 0}&priceMax=${priceMax || 100000}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.items)) {
        setScanProg(100);
        const results = data.items.slice(0, 30);
        setHits(results);

        // 🔔 แจ้งเตือนหุ้นที่เข้าเงื่อนไข
        for (const item of results.slice(0, 10)) {
          const msg = `⚡ ${item.symbol} | ${item.ai} | RSI=${item.rsi} | $${item.price}`;
          setMessages((p) => [...p, { id: Date.now() + Math.random(), msg }]);
          beep();
        }
      } else {
        setMessages((p) => [
          ...p,
          { id: Date.now(), msg: "❌ Scan failed: " + (data.error || "Unknown") },
        ]);
      }
    } catch (err) {
      setMessages((p) => [
        ...p,
        { id: Date.now(), msg: "⚠️ Error: " + err.message },
      ]);
    } finally {
      setScanning(false);
    }
  };

  // 🔄 Auto Scan ทุก 5 นาทีเมื่อเปิด Enable
  useEff2(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  // 🔥 ลบ Toast อัตโนมัติหลัง 5 วินาที
  useEff2(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => setMessages((p) => p.filter((x) => x.id !== m.id)), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">
        🛰️ Auto Scan — US Stocks
      </h2>

      {/* 🧠 ตัวเลือกเงื่อนไข */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="text-emerald-300 font-semibold">Enable</span>
        </label>

        <select
          className="bg-[#141b2d] px-2 py-1 rounded"
          value={aiSignal}
          onChange={(e) => setAiSignal(e.target.value)}
        >
          <option>Buy</option>
          <option>Sell</option>
          <option>Neutral</option>
          <option>Any</option>
        </select>

        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="RSI Min"
          value={rsiMin}
          onChange={(e) => setRsiMin(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="RSI Max"
          value={rsiMax}
          onChange={(e) => setRsiMax(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="Price Min"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-2 py-1 rounded"
          placeholder="Price Max"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />

        <button
          onClick={runScan}
          disabled={scanning}
          className={`rounded px-3 py-2 font-semibold border ${
            scanning
              ? "bg-gray-600/30 border-gray-500 text-gray-400"
              : "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
          }`}
        >
          {scanning ? "🔍 Scanning..." : "▶️ Run Now"}
        </button>
      </div>

      {/* 🔄 Progress Bar */}
      {scanning && (
        <div className="mt-2">
          <div className="w-full bg-[#1a2335] h-2 rounded">
            <div
              className="bg-cyan-400 h-2 rounded transition-all"
              style={{ width: `${scanProg}%` }}
            />
          </div>
          <div className="text-xs text-cyan-300 mt-1">
            Scanning... {scanProg}%
          </div>
        </div>
      )}

      {/* ✅ รายชื่อหุ้นที่เข้าเงื่อนไข */}
      <div className="mt-4">
        <h3 className="text-cyan-200 text-sm font-semibold mb-2">
          Latest Matches
        </h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบที่เข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2"
              >
                ⚡ {h.symbol} — {h.ai} | RSI={h.rsi} | ${h.price}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔔 Toast แจ้งเตือน */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-cyan-400/40 text-cyan-100 px-3 py-2 rounded shadow"
          >
            {m.msg}
          </div>
        ))}
      </div>
    </section>
  );
    }
