/* =========================
   🛰️ AUTO SCAN ทั้งตลาด (Realtime Stream)
========================= */
function AutoMarketScan() {
  const [enabled, setEnabled] = useSt(false);
  const [aiSignal, setAiSignal] = useSt("Any");
  const [rsiMin, setRsiMin] = useSt("35");
  const [rsiMax, setRsiMax] = useSt("55");
  const [priceMin, setPriceMin] = useSt("1");
  const [priceMax, setPriceMax] = useSt("25");
  const [progress, setProgress] = useSt(0);
  const [hits, setHits] = useSt([]);
  const [messages, setMessages] = useSt([]);
  const [logs, setLogs] = useSt([]);
  const [scanning, setScanning] = useSt(false);

  // 🔊 เสียงแจ้งเตือน
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    } catch {}
  };

  // 🚀 เริ่มสแกนแบบ Realtime Stream
  const runScan = async () => {
    if (scanning) return;
    setScanning(true);
    setHits([]);
    setLogs(["🚀 เริ่มสแกนตลาดหุ้นสหรัฐ..."]);
    setProgress(0);

    try {
      const url = `/api/scan?mode=${aiSignal}&rsiMin=${rsiMin}&rsiMax=${rsiMax}&priceMin=${priceMin}&priceMax=${priceMax}&maxSymbols=8000&batchSize=80`;
      const res = await fetch(url);
      if (!res.body) throw new Error("ไม่สามารถเชื่อมต่อสตรีมข้อมูลได้");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const data = JSON.parse(part);

            if (data.log) setLogs((p) => [...p, data.log].slice(-80));
            if (data.progress) setProgress(data.progress);

            if (data.hit) {
              const { symbol, ai, rsi, price } = data.hit;
              const msg = `⚡ ${symbol} | ${ai} | RSI ${rsi} | $${price}`;
              setHits((p) => [...p, { symbol, ai, rsi, price }]);
              setMessages((p) => [...p, { id: Date.now() + Math.random(), msg }]);
              beep();
            }

            if (data.done) {
              setLogs((p) => [...p, "✅ สแกนครบแล้ว"]);
              setProgress(100);
            }
          } catch {}
        }
      }
    } catch (err) {
      setLogs((p) => [...p, `❌ Error: ${err.message}`]);
    } finally {
      setScanning(false);
    }
  };

  // 🔁 Auto Scan ทุก 10 นาที
  useEff(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  // 🔔 Toast auto remove
  useEff(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => setMessages((p) => p.filter((x) => x.id !== m.id)), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">
        🛰️ Auto Scan — US Stocks (Realtime)
      </h2>

      {/* ตัวควบคุม */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

      {/* Progress */}
      <div className="mt-3">
        <div className="w-full bg-[#1a2335] h-2 rounded">
          <div
            className="bg-cyan-400 h-2 rounded transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-cyan-300 mt-1">
          {scanning
            ? `กำลังสแกน... ${progress}%`
            : `สถานะ: ${enabled ? "Auto Enabled" : "Idle"}`}
        </div>
      </div>

      {/* Logs */}
      <div className="mt-3 bg-[#0d1423]/70 p-3 rounded-lg text-xs text-gray-300 h-32 overflow-y-auto font-mono">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* Hits */}
      <div className="mt-4">
        <h3 className="text-cyan-200 text-sm font-semibold mb-2">
          Latest Matches ({hits.length})
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

      {/* Toast */}
      <div className="fixed top-28 right-4 space-y-2 z-50">
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
