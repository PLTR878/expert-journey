/* =========================    
   🛰️ AUTO SCAN ทั้งตลาด (AI) — เวอร์ชันสมบูรณ์พร้อมนับจำนวน    
========================= */    
function AutoMarketScan() {    
  const [enabled, setEnabled] = useSt(false);    
  const [aiSignal, setAiSignal] = useSt("Any");    
  const [rsiMin, setRsiMin] = useSt("25");    
  const [rsiMax, setRsiMax] = useSt("70");    
  const [priceMin, setPriceMin] = useSt("0.5");    
  const [priceMax, setPriceMax] = useSt("100");    
  const [progress, setProgress] = useSt(0);    
  const [logs, setLogs] = useSt([]);    
  const [hits, setHits] = useSt([]);    
  const [scannedCount, setScannedCount] = useSt(0);    
  const [totalCount, setTotalCount] = useSt(0);    

  const beep = () => {    
    try {    
      const ctx = new (window.AudioContext || window.webkitAudioContext)();    
      const osc = ctx.createOscillator();    
      osc.type = "sine";    
      osc.frequency.value = 850;    
      osc.connect(ctx.destination);    
      osc.start();    
      setTimeout(() => { osc.stop(); ctx.close(); }, 180);    
    } catch {}    
  };    
  const vibrate = (ms = 250) => navigator.vibrate && navigator.vibrate(ms);    

  const runScan = async () => {    
    if (!enabled) return;    
    setLogs(["🚀 เริ่มสแกนตลาดหุ้นอเมริกา..."]);    
    setHits([]);    
    setProgress(0);    
    setScannedCount(0);    
    setTotalCount(0);    

    const limit = 200;    
    let offset = 0;    
    let found = [];    
    let total = 0;    

    for (let i = 0; i < 25; i++) {    
      try {    
        const res = await fetch(`/api/ai-picks?limit=${limit}&offset=${offset}&nocache=1`);    
        const data = await res.json();    
        const list = data?.results || [];    
        total += list.length;    

        for (const item of list) {    
          const sym = item.symbol || item.ticker;    
          const sig = String(item.signal || "").toLowerCase();    
          const price = item.price ?? item.lastClose ?? 0;    
          const rsi = item.rsi ?? 50;    

          if (aiSignal !== "Any" && sig !== aiSignal.toLowerCase()) continue;    
          if (rsiMin && rsi < Number(rsiMin)) continue;    
          if (rsiMax && rsi > Number(rsiMax)) continue;    
          if (priceMin && price < Number(priceMin)) continue;    
          if (priceMax && price > Number(priceMax)) continue;    

          const msg = `⚡ ${sym} | AI=${item.signal} | RSI=${rsi} | $${price}`;    
          if (!found.find((x) => x.msg === msg)) {    
            found.push({ msg });    
            beep();    
            vibrate();    
            setLogs((p) => [...p.slice(-40), msg]);    
            setHits((p) => [...p.slice(-30), { symbol: sym, msg }]);    
          }    
        }    

        const pct = Math.round(((i + 1) / 25) * 100);    
        setProgress(pct);    
        setScannedCount(total);    
        setTotalCount(i * limit + list.length);    

        setLogs((p) => [...p.slice(-40), `📊 สแกนแล้ว ${total} ตัว (${pct}%)`]);    

        offset += limit;    
        if (list.length < limit) break;    
      } catch (err) {    
        console.error("Scan error:", err);    
        break;    
      }    
    }    

    setLogs((p) => [...p, `✅ สแกนเสร็จทั้งหมด ${total} หุ้น พบตรงเงื่อนไข ${found.length} ตัว`]);    
    setProgress(100);    
  };    

  useEff(() => {    
    if (!enabled) return;    
    runScan();    
    const id = setInterval(runScan, 5 * 60 * 1000);    
    return () => clearInterval(id);    
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);    

  return (    
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">    
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">🛰️ Auto Scan — US Stocks</h2>    

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">    
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">    
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />    
          <span className="text-emerald-300 font-semibold">Enable</span>    
        </label>    
        <select className="bg-[#141b2d] px-2 py-1 rounded" value={aiSignal} onChange={(e) => setAiSignal(e.target.value)}>    
          <option>Buy</option>    
          <option>Sell</option>    
          <option>Neutral</option>    
          <option>Any</option>    
        </select>    
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="RSI Min" value={rsiMin} onChange={(e) => setRsiMin(e.target.value)} />    
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="RSI Max" value={rsiMax} onChange={(e) => setRsiMax(e.target.value)} />    
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="Price Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />    
        <input className="bg-[#141b2d] px-2 py-1 rounded" placeholder="Price Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />    
        <button onClick={runScan} className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold">▶️ Run Now</button>    
      </div>    

      <div className="w-full bg-[#1a2335] h-2 rounded">    
        <div className="bg-cyan-400 h-2 rounded transition-all" style={{ width: `${progress}%` }}></div>    
      </div>    
      <div className="text-xs text-cyan-300 mt-1">Scanning... {progress}% — สแกนแล้ว {scannedCount} ตัว</div>    

      {/* Log สด */}    
      <div className="bg-[#0d1423]/60 p-2 mt-3 rounded text-[12px] text-gray-300 h-28 overflow-y-auto font-mono">    
        {logs.map((l, i) => <div key={i}>{l}</div>)}    
      </div>    

      {/* ผลลัพธ์ */}    
      <div className="mt-3">    
        <h3 className="text-cyan-200 text-sm font-semibold mb-1">Latest Matches ({hits.length})</h3>    
        {hits.length === 0 ? (    
          <div className="text-gray-400 text-sm">ยังไม่พบหุ้นเข้าเงื่อนไข</div>    
        ) : (    
          <ul className="space-y-1">    
            {hits.map((h, i) => (    
              <li key={i} className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-1.5">    
                {h.msg}    
              </li>    
            ))}    
          </ul>    
        )}    
      </div>    
    </section>    
  );    
    }
