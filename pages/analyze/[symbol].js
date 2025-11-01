// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Stock + Option Summary Integrated + Supreme Layout)
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../../components/Chart.js"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

export default function Analyze() {
  const { query } = useRouter();
  const symbol = (query.symbol || "").toString().toUpperCase();
  const [core, setCore] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [news, setNews] = useState([]);
  const [mode, setMode] = useState("stock");
  const [loading, setLoading] = useState(true);

  // ✅ โหลดข้อมูลจากทุก API
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/visionary-core?symbol=${symbol}`);
        const data = await res.json();
        setCore(data);
        setScanner({
          targetPrice: data.lastClose * 1.08,
          confidence: data.confidence,
          reason: "AI expects upside momentum",
        });
      } catch (e) {
        console.error("⚠️ Analyzer fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  const sig = computeSignal(core || {});
  const price = core?.lastClose || 0;
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
      <div className="max-w-6xl mx-auto px-3 py-5 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm bg-white/5 px-3 py-1 rounded border border-white/10 hover:bg-emerald-500/10"
          >
            ← ย้อนกลับ
          </button>
          <h1 className="text-lg font-bold text-white tracking-widest">{symbol}</h1>
          <div className="text-emerald-400 font-semibold text-sm border border-emerald-400/30 rounded px-2 py-0.5">
            ${fmt(price, 2)}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0f172a]">
          <Chart candles={hist} markers={markers} />
        </div>

        {/* Toggle Mode */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setMode("stock")}
            className={`px-3 py-1 rounded-md text-sm font-semibold ${
              mode === "stock" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400"
            }`}
          >
            หุ้นธรรมดา (Stock)
          </button>
          <button
            onClick={() => setMode("option")}
            className={`px-3 py-1 rounded-md text-sm font-semibold ${
              mode === "option" ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-400"
            }`}
          >
            ออปชั่น (Option)
          </button>
        </div>

        {/* Signal */}
        <AISignalSection ind={core} sig={sig} price={price} scanner={scanner} mode={mode} />
      </div>
    </main>
  );
}

// ===== AI LOGIC =====
function computeSignal({ lastClose, ema20, ema50, ema200, rsi, trend }) {
  if (![lastClose, ema20, ema50, ema200, rsi].every((v) => Number.isFinite(v)))
    return { action: "Hold", confidence: 0.5, reason: "ข้อมูลไม่เพียงพอ" };

  let score = 0;
  if (lastClose > ema20) score++;
  if (ema20 > ema50) score++;
  if (ema50 > ema200) score++;
  if (rsi > 55) score++;
  if (trend === "Uptrend") score += 0.5;

  if (score >= 3) return { action: "Buy", confidence: 90, reason: "แนวโน้มขาขึ้นแข็งแรง" };
  if (score <= 1) return { action: "Sell", confidence: 70, reason: "แรงขายกดดัน" };
  return { action: "Hold", confidence: 50, reason: "สัญญาณเป็นกลาง" };
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#141b2d] p-3 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-100">{value}</div>
    </div>
  );
}

function AISignalSection({ ind, sig, price, scanner, mode }) {
  const conf = scanner?.confidence ?? sig.confidence;
  const reason = scanner?.reason ?? sig.reason;
  const target = scanner?.targetPrice ?? price * 1.08;

  const optionCall = { strike: 21.0, premium: 0.6, roi: 85 };
  const optionPut = { strike: 19.0, premium: 0.4, roi: 15 };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4 space-y-4 shadow-inner">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-emerald-400">AI Trade & Option Summary</h2>
        <span
          className={`font-bold ${
            sig.action === "Buy"
              ? "text-green-400"
              : sig.action === "Sell"
              ? "text-red-400"
              : "text-yellow-300"
          }`}
        >
          {sig.action}
        </span>
      </div>

      {/* Trade Summary */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
        <div>💵 ราคา: ${fmt(price)}</div>
        <div>📊 RSI: {fmt(ind?.rsi)}</div>
        <div>📈 แนวโน้ม: {ind?.trend}</div>
        <div>🧠 AI Score: {fmt(sig.confidence)}</div>
      </div>

      {/* EMA Table */}
      <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-3">
        <h3 className="text-emerald-400 font-semibold mb-2 text-sm">EMA Overview</h3>
        <div className="grid grid-cols-4 gap-2 text-sm text-center">
          <Info label="Last" value={`$${fmt(ind?.lastClose)}`} />
          <Info label="EMA20" value={fmt(ind?.ema20)} />
          <Info label="EMA50" value={fmt(ind?.ema50)} />
          <Info label="EMA200" value={fmt(ind?.ema200)} />
        </div>
      </div>

      {/* Option Summary */}
      <div className="bg-[#131c2d] rounded-xl border border-pink-500/20 p-3">
        <h3 className="text-pink-400 font-semibold mb-2 text-sm">Option Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-[#1b2435] rounded-lg p-2">
            <p className="text-gray-400 text-xs">🟢 Top Call</p>
            <p className="font-bold">Strike: ${optionCall.strike}</p>
            <p>Premium: ${optionCall.premium}</p>
            <p className="text-emerald-400">ROI: +{optionCall.roi}%</p>
          </div>
          <div className="bg-[#1b2435] rounded-lg p-2">
            <p className="text-gray-400 text-xs">🔴 Top Put</p>
            <p className="font-bold">Strike: ${optionPut.strike}</p>
            <p>Premium: ${optionPut.premium}</p>
            <p className="text-pink-400">ROI: +{optionPut.roi}%</p>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          <p>📘 Reason: {reason}</p>
          <p>🎯 Entry Zone: Active Buy Zone</p>
        </div>
        <div className="mt-2 bg-[#0f172a] rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-emerald-400"
            style={{ width: `${conf}%` }}
          />
        </div>
      </div>
    </section>
  );
              }
