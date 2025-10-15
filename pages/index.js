import { useEffect, useState } from "react";

// ---------- หน้าหลัก ----------
export default function Home() {
  const [favorites, setFavorites] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [aiPicks, setAiPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");

  // โหลด favorite
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // โหลดข้อมูลหุ้น AI Picks
  async function loadAll() {
    setLoading(true);
    try {
      const r = await fetch(`/api/ai-picks?limit=200&nocache=1`).then((x) => x.json());
      setAiPicks(r?.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const toggleFavorite = (sym) =>
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <header className="sticky top-0 bg-[#0e1628]/80 backdrop-blur border-b border-white/10 p-3 flex justify-between items-center">
        <b className="text-emerald-400 text-lg">🌍 Visionary Stock Screener</b>
        <button
          onClick={loadAll}
          className="bg-emerald-500/10 border border-emerald-400/30 px-3 py-1 rounded text-emerald-300 text-sm"
        >
          {loading ? "Loading..." : "🔁 Refresh"}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {activeTab === "alerts" && (
          <>
            <AlertSystem />
            <AutoMarketScan /> {/* ✅ ระบบ AI Auto Scan */}
          </>
        )}
      </div>

      {/* เมนูด้านล่าง */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e1628]/90 border-t border-white/10 backdrop-blur flex justify-around text-gray-400 text-[12px] z-50">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`py-2 flex flex-col items-center ${
            activeTab === "alerts" ? "text-emerald-400" : ""
          }`}
        >
          <span className="text-[18px]">🔔</span>
          Alerts
        </button>
      </nav>
    </main>
  );
}

// ---------- ระบบแจ้งเตือนหุ้น ----------
import { useEffect as useEff, useState as useSt } from "react";

function AlertSystem() {
  const [alerts, setAlerts] = useSt([]);
  const [symbol, setSymbol] = useSt("");
  const [type, setType] = useSt("price_above");
  const [value, setValue] = useSt("");
  const [messages, setMessages] = useSt([]);

  // โหลดจาก localStorage
  useEff(() => {
    const saved = localStorage.getItem("alerts");
    if (saved) setAlerts(JSON.parse(saved));
  }, []);
  useEff(() => {
    localStorage.setItem("alerts", JSON.stringify(alerts));
  }, [alerts]);

  // ตรวจราคาทุก 1 นาที
  useEff(() => {
    const checkAlerts = async () => {
      for (const a of alerts) {
        try {
          const r = await fetch(`/api/price?symbol=${encodeURIComponent(a.symbol)}`);
          const j = await r.json();
          const price = j.price ?? 0;
          let hit = false;
          if (a.type === "price_above" && price > a.value) hit = true;
          if (a.type === "price_below" && price < a.value) hit = true;
          if (hit) {
            const msg = `🔔 ${a.symbol} ${a.type.replace("_", " ")} ${a.value} (now $${price})`;
            setMessages((p) => [...p, { id: Date.now(), msg }]);
            beep();
          }
        } catch {}
      }
    };
    const beep = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 300);
    };
    checkAlerts();
    const id = setInterval(checkAlerts, 60 * 1000);
    return () => clearInterval(id);
  }, [alerts]);

  useEff(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => setMessages((p) => p.filter((x) => x.id !== m.id)), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  const addAlert = () => {
    if (!symbol || !value) return alert("กรอก Symbol และ Value ก่อน");
    setAlerts((p) => [...p, { symbol: symbol.toUpperCase(), type, value: Number(value) }]);
    setSymbol("");
    setValue("");
  };

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 border border-emerald-400/30 mb-6">
      <h2 className="text-emerald-300 text-lg mb-2">📢 Stock Alerts</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          placeholder="Symbol"
          className="bg-[#141b2d] px-3 py-1 rounded"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <select
          className="bg-[#141b2d] px-3 py-1 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="price_above">Price &gt;</option>
          <option value="price_below">Price &lt;</option>
        </select>
        <input
          placeholder="Value"
          className="bg-[#141b2d] px-3 py-1 rounded"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          onClick={addAlert}
          className="bg-emerald-600/30 border border-emerald-400/50 rounded px-3 py-1"
        >
          ➕ Add
        </button>
      </div>
      {alerts.length === 0 ? (
        <p className="text-gray-400 text-sm">ยังไม่มีแจ้งเตือน</p>
      ) : (
        <ul className="text-sm space-y-1">
          {alerts.map((a, i) => (
            <li key={i} className="text-gray-200 bg-[#0e1628]/70 rounded p-2 border border-white/5">
              {a.symbol} — {a.type.replace("_", " ")} {a.value}
            </li>
          ))}
        </ul>
      )}
      {/* Toast */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-emerald-400/40 text-emerald-100 px-3 py-2 rounded shadow"
          >
            {m.msg}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- ✅ ระบบสแกนหุ้นอัตโนมัติ (AI Auto Scan ทั้งตลาด) ----------
import { useEffect as useEff2, useState as useSt2 } from "react";

function AutoMarketScan() {
  const [enabled, setEnabled] = useSt2(false);
  const [aiSignal, setAiSignal] = useSt2("Buy");
  const [rsiMin, setRsiMin] = useSt2("");
  const [rsiMax, setRsiMax] = useSt2("");
  const [priceMin, setPriceMin] = useSt2("");
  const [priceMax, setPriceMax] = useSt2("");
  const [scanProg, setScanProg] = useSt2(0);
  const [hits, setHits] = useSt2([]);
  const [messages, setMessages] = useSt2([]);

  const beep = () => {
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
  };

  const match = (r) => {
    const sig = (r.signal || "").toLowerCase();
    const price = r.price ?? r.lastClose ?? 0;
    const rsi = r.rsi ?? 50;
    if (aiSignal !== "Any" && sig !== aiSignal.toLowerCase()) return false;
    if (rsiMin && rsi < Number(rsiMin)) return false;
    if (rsiMax && rsi > Number(rsiMax)) return false;
    if (priceMin && price < Number(priceMin)) return false;
    if (priceMax && price > Number(priceMax)) return false;
    return true;
  };

  const runScan = async () => {
    if (!enabled) return;
    setScanProg(0);
    setHits([]);
    let found = [];
    const limit = 200;
    let off = 0;
    for (let i = 0; i < 25; i++) {
      try {
        const r = await fetch(`/api/ai-picks?limit=${limit}&offset=${off}&nocache=1`).then((x) => x.json());
        const list = r?.results || [];
        for (const item of list) {
          if (match(item)) {
            const msg = `⚡ ${item.symbol} | AI=${item.signal} | RSI=${item.rsi} | $${item.price}`;
            if (!found.find((f) => f.msg === msg)) {
              found.push({ msg });
              setMessages((p) => [...p, { id: Date.now(), msg }]);
              beep();
            }
          }
        }
        setScanProg(Math.round(((i + 1) / 25) * 100));
        if (list.length < limit) break;
        off += limit;
      } catch {}
    }
    setHits(found.slice(0, 30));
  };

  // สแกนอัตโนมัติทุก 5 นาที
  useEff2(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mt-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">🛰️ Auto Scan — US Stocks</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
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
            <div className="bg-cyan-400 h-2 rounded" style={{ width: `${scanProg}%` }} />
          </div>
          <div className="text-xs text-cyan-300 mt-1">Scanning... {scanProg}%</div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-cyan-200 text-sm font-semibold mb-2">Latest Matches</h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบที่เข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li key={i} className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2">
                {h.msg}
              </li>
            ))}
          </ul>
        )}
      </div>

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
// ============= ✅ ระบบแจ้งเตือนหุ้น =============
function AlertSystem() {
  const [alerts, setAlerts] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("price_above"); // price_above|price_below|rsi_above|rsi_below|ai_is
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState([]);

  // โหลด/บันทึก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("alerts");
    if (saved) setAlerts(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("alerts", JSON.stringify(alerts));
  }, [alerts]);

  // เสียงเตือนสั้น ๆ
  const beep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 250);
  };

  // ตรวจแจ้งเตือนทุก 60 วินาที
  useEffect(() => {
    const checkAlerts = async () => {
      for (const a of alerts) {
        try {
          const r = await fetch(`/api/price?symbol=${encodeURIComponent(a.symbol)}`);
          const j = await r.json();
          const price = j.price ?? 0;
          const rsi = j.rsi ?? 50;
          const sig = (j.signal ?? "Neutral").toLowerCase();

          let hit = false;
          if (a.type === "price_above" && price > Number(a.value)) hit = true;
          if (a.type === "price_below" && price < Number(a.value)) hit = true;
          if (a.type === "rsi_above" && rsi > Number(a.value)) hit = true;
          if (a.type === "rsi_below" && rsi < Number(a.value)) hit = true;
          if (a.type === "ai_is" && sig === String(a.value).toLowerCase()) hit = true;

          if (hit) {
            const msg = `🔔 ${a.symbol} ${a.type.replace("_", " ")} ${a.value} — now $${price} | RSI ${Math.round(rsi)} | AI ${sig}`;
            setMessages((p) => [...p, { id: Date.now(), msg }]);
            beep();
          }
        } catch {}
      }
    };
    checkAlerts();
    const id = setInterval(checkAlerts, 60 * 1000);
    return () => clearInterval(id);
  }, [alerts]);

  // Toast auto-hide
  useEffect(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((p) => p.filter((x) => x.id !== m.id));
      }, 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  const addAlert = () => {
    if (!symbol.trim()) return alert("กรอก Symbol");
    if (!value && type !== "ai_is") return alert("กรอก Value");
    const v = type === "ai_is" ? value || "buy" : Number(value);
    setAlerts((p) => [
      ...p,
      {
        id: Date.now(),
        symbol: symbol.trim().toUpperCase(),
        type,
        value: v,
      },
    ]);
    setSymbol("");
    setValue("");
  };

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 mb-6 border border-emerald-400/30">
      <h2 className="text-emerald-400 text-lg font-semibold mb-2">🔔 Stock Alerts</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="bg-[#141b2d] px-3 py-2 rounded w-28"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <select
          className="bg-[#141b2d] px-3 py-2 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="price_above">Price &gt;</option>
          <option value="price_below">Price &lt;</option>
          <option value="rsi_above">RSI &gt;</option>
          <option value="rsi_below">RSI &lt;</option>
          <option value="ai_is">AI Signal =</option>
        </select>

        {type === "ai_is" ? (
          <select
            className="bg-[#141b2d] px-3 py-2 rounded"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">(เลือก)</option>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
            <option value="Neutral">Neutral</option>
          </select>
        ) : (
          <input
            className="bg-[#141b2d] px-3 py-2 rounded w-28"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}

        <button
          onClick={addAlert}
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-4 py-2 text-emerald-300 font-semibold"
        >
          ➕ Add
        </button>
      </div>

      <ul className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-gray-400">ยังไม่มีแจ้งเตือน</div>
        ) : (
          alerts.map((a) => (
            <li
              key={a.id}
              className="flex justify-between items-center bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2 text-sm"
            >
              <span className="text-emerald-200">
                {a.symbol} — {a.type} {String(a.value)}
              </span>
              <button
                onClick={() => setAlerts((p) => p.filter((x) => x.id !== a.id))}
                className="text-red-400 hover:text-red-300 text-xs underline"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Toast แจ้งเตือน */}
      <div className="fixed top-16 right-4 space-y-2 z-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-[#101827]/90 border border-emerald-400/30 text-emerald-200 px-3 py-2 rounded shadow"
          >
            {m.msg}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============= ✅ สแกนทั้งตลาดแบบอัตโนมัติ (AI Auto Scan) =============
function AutoMarketScan() {
  const [enabled, setEnabled] = useState(false);
  const [aiSignal, setAiSignal] = useState("Any"); // Buy|Sell|Neutral|Any
  const [rsiMin, setRsiMin] = useState("");
  const [rsiMax, setRsiMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [progress, setProgress] = useState(0);
  const [hits, setHits] = useState([]);
  const [messages, setMessages] = useState([]);

  // จำค่าตัวกรอง
  useEffect(() => {
    const s = localStorage.getItem("autoscan_cfg");
    if (s) {
      try {
        const j = JSON.parse(s);
        setEnabled(!!j.enabled);
        setAiSignal(j.aiSignal ?? "Any");
        setRsiMin(j.rsiMin ?? "");
        setRsiMax(j.rsiMax ?? "");
        setPriceMin(j.priceMin ?? "");
        setPriceMax(j.priceMax ?? "");
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "autoscan_cfg",
      JSON.stringify({ enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax })
    );
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  const beep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1000;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 180);
  };

  const matchRow = (r) => {
    const sig = (r.signal || "").toLowerCase();
    const price = r.price ?? r.lastClose ?? 0;
    const rsi = r.rsi ?? 50;

    if (aiSignal !== "Any" && sig !== aiSignal.toLowerCase()) return false;
    if (rsiMin && rsi < Number(rsiMin)) return false;
    if (rsiMax && rsi > Number(rsiMax)) return false;
    if (priceMin && price < Number(priceMin)) return false;
    if (priceMax && price > Number(priceMax)) return false;
    return true;
  };

  const runScan = async () => {
    setProgress(0);
    setHits([]);
    let found = [];

    const pageSize = 200;      // ดึงทีละ 200
    const maxPages = 25;       // สูงสุด ~5,000 รายการต่อรอบ
    let off = 0;

    for (let i = 0; i < maxPages; i++) {
      try {
        const r = await fetch(
          `/api/ai-picks?limit=${pageSize}&offset=${off}&nocache=1`
        ).then((x) => x.json().catch(() => ({})));

        const list = Array.isArray(r?.results) ? r.results : [];
        for (const row of list) {
          if (matchRow(row)) {
            const msg = `⚡ ${row.symbol} | AI=${row.signal} | RSI=${Math.round(row.rsi ?? 0)} | $${(row.price ?? row.lastClose ?? 0).toFixed(2)}`;
            if (!found.find((f) => f.msg === msg)) {
              found.push({ msg });
              setMessages((p) => [...p, { id: Date.now(), msg }]);
              beep();
            }
          }
        }

        setProgress(Math.round(((i + 1) / maxPages) * 100));
        if (list.length < pageSize) break; // หมดหน้า
        off += pageSize;
        await new Promise((r) => setTimeout(r, 120)); // ผ่อน API
      } catch {
        // เงียบไว้ ไปหน้าถัดไป
      }
    }
    setHits(found.slice(0, 50));
  };

  // สแกนอัตโนมัติทุก 5 นาทีเมื่อเปิดใช้งาน
  useEffect(() => {
    if (!enabled) return;
    runScan();
    const id = setInterval(runScan, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, aiSignal, rsiMin, rsiMax, priceMin, priceMax]);

  // Toast auto-hide
  useEffect(() => {
    if (!messages.length) return;
    const timers = messages.map((m) =>
      setTimeout(() => {
        setMessages((p) => p.filter((x) => x.id !== m.id));
      }, 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <section className="bg-[#101827]/80 rounded-2xl p-4 border border-cyan-400/30">
      <h2 className="text-cyan-300 text-lg font-semibold mb-2">🛰️ Auto Scan — US Stocks</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <label className="flex items-center gap-2 bg-[#141b2d] px-3 py-2 rounded">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="text-emerald-300 font-semibold">Enable</span>
        </label>

        <select
          className="bg-[#141b2d] px-3 py-2 rounded"
          value={aiSignal}
          onChange={(e) => setAiSignal(e.target.value)}
        >
          <option>Any</option>
          <option>Buy</option>
          <option>Sell</option>
          <option>Neutral</option>
        </select>

        <input
          className="bg-[#141b2d] px-3 py-2 rounded"
          placeholder="RSI Min"
          value={rsiMin}
          onChange={(e) => setRsiMin(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-3 py-2 rounded"
          placeholder="RSI Max"
          value={rsiMax}
          onChange={(e) => setRsiMax(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-3 py-2 rounded"
          placeholder="Price Min"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
        <input
          className="bg-[#141b2d] px-3 py-2 rounded"
          placeholder="Price Max"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />

        <button
          onClick={runScan}
          className="bg-emerald-500/20 border border-emerald-400/40 rounded px-4 py-2 text-emerald-300 font-semibold"
        >
          ▶️ Run Now
        </button>
      </div>

      {enabled && (
        <div className="mb-3">
          <div className="w-full bg-[#1a2335] h-2 rounded">
            <div className="bg-cyan-400 h-2 rounded" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-cyan-300 mt-1">Scanning... {progress}%</div>
        </div>
      )}

      <div>
        <h3 className="text-cyan-200 text-sm font-semibold mb-2">Latest Matches</h3>
        {hits.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่พบที่เข้าเงื่อนไข</div>
        ) : (
          <ul className="space-y-1">
            {hits.map((h, i) => (
              <li key={i} className="text-sm text-emerald-200 bg-[#0e1628]/70 border border-white/10 rounded px-3 py-2">
                {h.msg}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Toast จาก AutoScan */}
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
