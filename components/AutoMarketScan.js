/* =========================
   🛰️ AUTO SCAN — Real-Time Log + Sound + Vibrate
========================= */
function AutoMarketScan() {
  const [enabled, setEnabled] = useSt(false);
  const [aiSignal, setAiSignal] = useSt("Any");
  const [rsiMin, setRsiMin] = useSt("");
  const [rsiMax, setRsiMax] = useSt("");
  const [priceMin, setPriceMin] = useSt("");
  const [priceMax, setPriceMax] = useSt("");
  const [scanProg, setScanProg] = useSt(0);
  const [hits, setHits] = useSt([]);
  const [messages, setMessages] = useSt([]);
  const [logs, setLogs] = useSt([]);

  // 🔊 เสียงเตือน
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 900;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 180);
    } catch {}
  };

  // 📱 สั่นมือถือ
  const vibrate = (ms = 300) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  // 🚀 ฟังก์ชันสแกนตลาด
  const runScan = async () => {
    if (!enabled) return;
    setScanProg(0);
    setHits([]);
    setLogs(["🚀 เริ่มสแกนตลาดหุ้นอเมริกา..."]);

    try {
      const url = `/api/scan?mode=${aiSignal}&rsiMin=${rsiMin}&rsiMax=${rsiMax}&priceMin=${priceMin}&priceMax=${priceMax}`;
      const res = await fetch(url);
      if (!res.body) throw new Error("ไม่สามารถเชื่อมต่อ API ได้");

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

            if (data.log)
              setLogs((p) => [...p.slice(-60), data.log]);
            if (data.progress)
              setScanProg(data.progress);
            if (data.hit) {
              setHits((p) => [...p.slice(-30), data.hit]);
              beep();
              vibrate();
              setMessages((p) => [
                ...p,
                {
                  id: Date.now(),
                  msg: `⚡ ${data.hit.symbol} | ${data.hit.ai} | RSI=${data.hit.rsi} | $${data.hit.price}`,
                },
              ]);
            }
          } catch {}
        }
      }

      setLogs((p) => [...p, "✅ สแกนเสร็จสมบูรณ์"]);
      setScanProg(100);
    } catch (err) {
      setLogs((p) => [...p, `❌ Error: ${err.message}`]);
    }
  };

  // Auto run ทุก 5 นาที
  useEff(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  // Toast auto remove
  useEff(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((p) => p.filter((x) => x.id !== m.id));
      }, 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">
        🛰️ Auto Scan — US Stocks
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
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
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold"
        >
          ▶️ Run Now
        </button>
      </div>

      {/* Progress */}
      <div className="w-full bg-[#1a2335] h-2 rounded mt-1">
        <div
          className="bg-cyan-400 h-2 rounded transition-all"
          style={{ width: `${scanProg}%` }}
        ></div>
      </div>
      <div className="text-xs text-cyan-300 mt-1">Scanning... {scanProg}%</div>

      {/* 📜 Real-time Log */}
      <div className="bg-[#0d1423]/60 p-2 mt-3 rounded text-[12px] text-gray-300 h-28 overflow-y-auto font-mono">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* ⚡ Hits */}
      <div className="mt-3">
        <h3 className="text-cyan-200 text-sm font-semibold mb-1">
          Latest Matches ({hits.length})
        </h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบหุ้นเข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-1.5"
              >
                ⚡ {h.symbol} | {h.ai} | RSI={h.rsi} | ${h.price}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔔 Toast */}
      <div className="fixed top-24 right-4 space-y-2 z-50">
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
