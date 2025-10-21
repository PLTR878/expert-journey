// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Connected to Visionary Infinite Core V∞)
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../../components/Chart.js"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

export default function Analyze() {
  const { query, push } = useRouter();
  const symbol = (query.symbol || "").toString().toUpperCase();
  const [core, setCore] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ ดึงข้อมูลจาก Visionary Infinite Core ตัวเดียว
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/visionary-infinite-core?symbol=${symbol}`);
        const data = await res.json();
        setCore(data);
      } catch (e) {
        console.error("⚠️ Infinite Core fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  const hist = core?.chart?.timestamps
    ? core.chart.timestamps.map((t, i) => ({
        time: t,
        open: core.chart.open?.[i],
        high: core.chart.high?.[i],
        low: core.chart.low?.[i],
        close: core.chart.prices?.[i],
        volume: core.chart.volume?.[i],
      }))
    : [];

  const sig = {
    action: core?.signal || "Hold",
    confidence: (core?.confidence || 50) / 100,
    reason: core?.reason || "รอข้อมูลเพิ่มเติม",
  };

  const price = core?.lastClose || 0;

  // ✅ จุด BUY / SELL / HOLD
  const markers = useMemo(() => {
    if (!hist.length) return [];
    const t = Math.floor((hist.at(-1)?.time || Date.now()) / 1000);
    if (sig.action === "Buy")
      return [{ time: t, position: "belowBar", color: "#22c55e", shape: "arrowUp", text: "BUY" }];
    if (sig.action === "Sell")
      return [{ time: t, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: "SELL" }];
    return [{ time: t, position: "inBar", color: "#eab308", shape: "circle", text: "HOLD" }];
  }, [JSON.stringify(sig), hist.length]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header + Chart */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] border border-white/10 overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 flex justify-between items-start px-3 pt-2 z-10">
            <button
              onClick={() => push("/")}
              className="flex items-center gap-1 text-[13px] text-gray-300 bg-white/5 border border-white/10 rounded-md px-2.5 py-1 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
            >
              ← ย้อนกลับ
            </button>
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-0.5 text-center">
              <h1 className="text-lg font-bold text-white tracking-widest">{symbol}</h1>
            </div>
            <div className="ml-auto bg-transparent border border-emerald-400/30 text-emerald-400 font-semibold text-[14px] px-2.5 py-0.5 rounded-md">
              ${fmt(price, 2)}
            </div>
          </div>

          <div className="pt-12">
            <Chart candles={hist} markers={markers} />
          </div>
        </div>

        {/* SIGNAL */}
        <AISignalSection ind={core} sig={sig} price={price} />

        {/* ข่าว */}
        <MarketNews news={core?.news || []} />
      </div>
    </main>
  );
}

// ======= COMPONENTS =======
function Info({ label, value, className = "" }) {
  const color = value?.includes("%")
    ? value.includes("-")
      ? "text-red-400"
      : "text-emerald-400"
    : "text-gray-100";
  return (
    <div className={`rounded-xl border border-white/10 bg-[#141b2d] p-4 text-center ${className}`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function AISignalSection({ ind, sig, price }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5 shadow-inner space-y-6">
      <div>
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-semibold">AI Trade Signal</h2>
          <span
            className={
              sig.action === "Buy"
                ? "text-green-400"
                : sig.action === "Sell"
                ? "text-red-400"
                : "text-yellow-300"
            }
          >
            {sig.action === "Buy" ? "ซื้อ (Buy)" : sig.action === "Sell" ? "ขาย (Sell)" : "ถือ (Hold)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Info label="🎯 Target Price" value={`$${fmt(price * 1.08, 2)}`} />
          <Info label="🤖 Confidence" value={`${fmt(sig.confidence * 100, 0)}%`} />
          <Info label="📋 Reason" value={sig.reason} className="col-span-2" />
        </div>
      </div>
    </section>
  );
}

function MarketNews({ news }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5 shadow-inner">
      <h2 className="text-lg font-semibold mb-2">Market News</h2>
      {!news?.length ? (
        <div className="text-sm text-gray-400">No recent news.</div>
      ) : (
        <ul className="space-y-2">
          {news.slice(0, 10).map((n, i) => (
            <li key={i} className="p-3 bg-black/25 border border-white/10 rounded-lg">
              <a href={n.link} target="_blank" rel="noreferrer" className="hover:text-emerald-400">
                {n.title}
              </a>
              <div className="text-xs text-gray-400 mt-1">{n.publisher}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
                }
