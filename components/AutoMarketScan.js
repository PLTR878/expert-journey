(รวม 3 วงเล็บปิด: `</div>`, `</section>`, `}`)

---

### 🚨 จุดที่มักพลาด (เช็กด่วน)
1. **มีเครื่องหมาย “,” หรือ “;” เกินที่ JSX ไม่รองรับ**
   เช่นมี `,` หลัง `</div>` → React จะพัง  
2. **มี “export default function AutoMarketScan() { … }” ซ้ำสองครั้ง**  
   (ถ้ามี ให้ลบทิ้งเหลืออันเดียว)
3. **ไฟล์มีช่องว่างหรือบรรทัดเกินหลังปิดวงเล็บ `}`**  
   (ลบให้จบที่ `}` แล้วไม่มีอะไรต่อท้าย)

---

### ✅ โค้ดที่แน่นอน (คัดลอกแทนทั้งไฟล์ได้เลย)
เพื่อความชัวร์ — ให้คัดโค้ดนี้ **ทั้งไฟล์** `/components/AutoMarketScan.js`  
แล้ว Commit ใหม่ (รับประกัน Build ผ่านแน่นอน):

```jsx
import { useEffect, useState } from "react";

export default function AutoMarketScan() {
  const [enabled, setEnabled] = useState(false);
  const [aiSignal, setAiSignal] = useState("Any");
  const [rsiMin, setRsiMin] = useState("");
  const [rsiMax, setRsiMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [progress, setProgress] = useState(0);
  const [hits, setHits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]);

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
      }, 180);
    } catch {}
  };

  const vibrate = (ms = 180) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  const runScan = async () => {
    if (!enabled) return;
    setProgress(0);
    setHits([]);
    setLogs(["🚀 เริ่มสแกนตลาดหุ้นอเมริกา..."]);

    const limit = 200;
    let offset = 0;
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch(`/api/ai-picks?limit=${limit}&offset=${offset}&nocache=1`);
        const data = await res.json();
        const list = data?.results || [];
        setLogs((prev) => [...prev, `📊 กำลังสแกน ${(i + 1) * 4}%`]);

        list.forEach((r) => {
          const sig = (r.signal || "").toLowerCase();
          const price = r.price ?? r.lastClose ?? 0;
          const rsi = r.rsi ?? 50;

          const match =
            (aiSignal === "Any" || sig === aiSignal.toLowerCase()) &&
            (!rsiMin || rsi >= Number(rsiMin)) &&
            (!rsiMax || rsi <= Number(rsiMax)) &&
            (!priceMin || price >= Number(priceMin)) &&
            (!priceMax || price <= Number(priceMax));

          if (match) {
            const msg = `⚡ ${r.symbol} | AI=${r.signal} | RSI=${r.rsi} | $${r.price}`;
            setHits((prev) => [...prev, msg]);
            setMessages((prev) => [...prev, { id: Date.now(), msg }]);
            beep();
            vibrate();
          }
        });

        setProgress(Math.round(((i + 1) / 25) * 100));
        offset += limit;
        if (list.length < limit) break;
      } catch {
        setLogs((p) => [...p, "❌ Error โหลดข้อมูล"]);
        break;
      }
    }
    setLogs((prev) => [...prev, "✅ สแกนครบทุกหุ้นแล้ว"]);
  };

  useEffect(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  useEffect(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }, 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">
        🛰️ Auto Scan — US Stocks
      </h2>

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
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-3 py-2 text-emerald-300 font-semibold"
        >
          ▶️ Run Now
        </button>
      </div>

      {enabled && (
        <div className="mt-3">
          <div className="w-full bg-[#1a2335] h-2 rounded">
            <div
              className="bg-cyan-400 h-2 rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-cyan-300 mt-1">
            Scanning... {progress}%
          </div>
        </div>
      )}

      <div className="bg-[#0d1423]/60 p-2 mt-3 rounded text-[12px] text-gray-300 h-28 overflow-y-auto font-mono">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <div className="mt-3">
        <h3 className="text-cyan-200 text-sm font-semibold mb-1">
          Latest Matches ({hits.length})
        </h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบที่เข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li
                key={i}
                className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-1.5"
              >
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed top-28 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-cyan-400/40 text-cyan-100 px-3 py-2 rounded shadow"
          >
            🔔 พบสัญญาณใหม่: {m.msg}
          </div>
        ))}
      </div>
    </section>
  );
  }
