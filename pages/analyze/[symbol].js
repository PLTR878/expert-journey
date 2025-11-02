// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Stock + Option + AI Entry Zone + Compact Font + Option Simulator)
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
  const [optionAI, setOptionAI] = useState(null);
  const [news, setNews] = useState([]);
  const [mode, setMode] = useState("stock");
  const [loading, setLoading] = useState(true);

  // ===== โหลดข้อมูลหุ้นหลัก =====
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const infiniteRes = await fetch(`/api/visionary-infinite-core?symbol=${symbol}`).then((r) => r.json());
        const isInfiniteOk = infiniteRes && !infiniteRes.error && infiniteRes.symbol;

        // ✅ โหลด Option Core สำรอง
        try {
          const optExtra = await fetch(`/api/visionary-option-core?symbol=${symbol}`).then(r => r.json());
          if (optExtra && !optExtra.error) setOptionAI(optExtra);
        } catch (err) {
          console.warn("⚠️ Option Core fetch fail:", err);
        }

        if (isInfiniteOk) {
          setCore(infiniteRes);
          setScanner({
            targetPrice: infiniteRes.lastClose * 1.08,
            confidence: infiniteRes.confidence,
            reason: infiniteRes.reason,
          });
          setNews(infiniteRes.news || []);
        } else {
          const [coreRes, scannerRes, newsRes] = await Promise.all([
            fetch(`/api/visionary-core?symbol=${symbol}`).then((r) => r.json()),
            fetch(`/api/visionary-scanner?symbol=${symbol}`).then((r) => r.json()),
            fetch(`/api/news?symbol=${symbol}`).then((r) => r.json()),
          ]);
          setCore(coreRes);
          setScanner(scannerRes);
          setNews(newsRes.items || []);
        }
      } catch (e) {
        console.error("⚠️ Analyzer fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  // ===== โหลดข้อมูล Option AI หลัก =====
  useEffect(() => {
    if (!symbol) return;
    fetch(`/api/visionary-option-ai?symbol=${symbol}`)
      .then((r) => r.json())
      .then(setOptionAI)
      .catch((e) => console.error("Option AI error:", e));
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
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold">
      <div className="max-w-6xl mx-auto px-3 py-5 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="text-[12px] bg-white/5 px-3 py-1 rounded border border-white/10 hover:bg-emerald-500/10"
          >
            ← ย้อนกลับ
          </button>
          <h1 className="text-[14px] font-bold tracking-widest">{symbol}</h1>
          <div className="text-emerald-400 font-semibold text-[12px] border border-emerald-400/30 rounded px-2 py-0.5">
            ${fmt(price, 2)}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0f172a]">
          <Chart candles={hist} markers={markers} />
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setMode("stock")}
            className={`px-3 py-1 rounded-md text-[12px] font-bold ${
              mode === "stock" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400"
            }`}
          >
            หุ้นธรรมดา (Stock)
          </button>
          <button
            onClick={() => setMode("option")}
            className={`px-3 py-1 rounded-md text-[12px] font-bold ${
              mode === "option" ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-400"
            }`}
          >
            ออปชั่น (Option)
          </button>
        </div>

        <AISignalSection ind={core} sig={sig} price={price} scanner={scanner} optionAI={optionAI} mode={mode} />
        <MarketNews news={news} />
      </div>
    </main>
  );
}

// ===== Logic =====
function computeSignal({ lastClose, ema20, ema50, ema200, rsi, trend }) {
  if (![lastClose, ema20, ema50, ema200, rsi].every((v) => Number.isFinite(v)))
    return { action: "Hold", confidence: 0.5, reason: "ข้อมูลไม่เพียงพอ" };

  let score = 0;
  if (lastClose > ema20) score++;
  if (ema20 > ema50) score++;
  if (ema50 > ema200) score++;
  if (rsi > 55) score++;
  if (trend === "Uptrend") score += 0.5;
  if (trend === "Downtrend") score -= 0.5;

  if (score >= 3) return { action: "Buy", confidence: 90, reason: "แนวโน้มขาขึ้นแข็งแรง" };
  if (score <= 1) return { action: "Sell", confidence: 70, reason: "แรงขายกดดัน" };
  return { action: "Hold", confidence: 50, reason: "สัญญาณเป็นกลาง" };
}

// ===== UI =====
function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#141b2d] p-1.5 text-center">
      <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-[12px] font-bold text-gray-100">{value}</div>
    </div>
  );
}

function AISignalSection({ ind, sig, price, scanner, optionAI, mode }) {
  const baseConf = scanner?.confidence ?? sig.confidence * 100;
  const rsi = ind?.rsi ?? 0;
  const target = scanner?.targetPrice ?? price * 1.08;
  const reason = scanner?.reason || sig.reason;
  const showOption = mode === "option";

  const action = showOption ? optionAI?.signal || sig.action : sig.action;
  const conf = showOption ? optionAI?.confidence || baseConf : baseConf;
  const call = optionAI?.topCall || { strike: "-", premium: "-", roi: "-" };
  const put = optionAI?.topPut || { strike: "-", premium: "-", roi: "-" };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3 space-y-3 shadow-inner">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[13px] font-bold tracking-widest">
          AI {showOption ? "Option" : "Trade"} Signal
        </h2>
        <span
          className={`font-bold ${
            action === "Buy"
              ? "text-green-400"
              : action === "Sell"
              ? "text-red-400"
              : "text-yellow-300"
          }`}
        >
          {action}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[12px]">
        <Info label="🎯 Target" value={`$${fmt(optionAI?.target || target, 2)}`} />
        <Info label="🤖 Confidence" value={`${fmt(conf, 0)}%`} />
        <Info label="📋 Reason" value={optionAI?.reason || reason} />
        <Info label="RSI (14)" value={fmt(rsi, 1)} />
      </div>

      {/* EMA */}
      <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-2">
        <h3 className="text-emerald-400 font-semibold mb-1 text-[11px]">EMA Overview</h3>
        <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center">
          <Info label="Last" value={`$${fmt(ind?.lastClose)}`} />
          <Info label="EMA20" value={fmt(ind?.ema20)} />
          <Info label="EMA50" value={fmt(ind?.ema50)} />
          <Info label="EMA200" value={fmt(ind?.ema200)} />
        </div>
      </div>

      {/* ✅ Option Summary */}
      {showOption && (
        <>
          <div className="bg-[#131c2d] rounded-xl border border-pink-500/20 p-2 space-y-2">
            <h3 className="text-pink-400 font-bold text-[12px] mb-1 tracking-wider">Option Summary</h3>

            <div className="grid grid-cols-2 gap-1.5 text-[12px]">
              <div className="bg-[#1b2435] rounded-lg p-1.5 text-center">
                <p className="text-gray-400 text-[11px]">🟢 Top Call</p>
                <p className="font-semibold">Strike: ${call.strike}</p>
                <p className="text-[11px]">Premium: ${call.premium}</p>
                <p className="text-emerald-400 text-[11px]">ROI: +{call.roi}%</p>
              </div>
              <div className="bg-[#1b2435] rounded-lg p-1.5 text-center">
                <p className="text-gray-400 text-[11px]">🔴 Top Put</p>
                <p className="font-semibold">Strike: ${put.strike}</p>
                <p className="text-[11px]">Premium: ${put.premium}</p>
                <p className="text-pink-400 text-[11px]">ROI: +{put.roi}%</p>
              </div>
            </div>

            <div className="text-[11px] text-gray-300">
              <p>📘 Reason: {optionAI?.reason}</p>
              <p>
                🎯 Entry Zone:{" "}
                <span className="text-emerald-400 font-semibold">{optionAI?.zone || "Active Zone"}</span>
              </p>
            </div>
            <div className="mt-1 h-2 bg-[#0f172a] rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-emerald-400 transition-all"
                style={{ width: `${conf}%` }}
              />
            </div>
          </div>

          {/* ✅ Option Simulator (Δ + Θ) */}
          <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-3 space-y-2">
            <h3 className="text-emerald-400 font-bold text-[12px] mb-1 tracking-wider">
              Option Simulator (Δ + Θ)
            </h3>

            <div className="grid grid-cols-2 gap-1.5 text-[12px]">
              <div>
                <label className="text-gray-400 text-[11px]">Δ Delta</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={optionAI?.delta || 0.2}
                  onChange={(e) => (window._delta = parseFloat(e.target.value))}
                  className="w-full bg-[#1b2435] text-white text-center rounded p-1 border border-white/10"
                />
              </div>
              <div>
                <label className="text-gray-400 text-[11px]">Θ Theta</label>
                <input
                  type="number"
                  step="0.001"
                  defaultValue={optionAI?.theta || -0.008}
                  onChange={(e) => (window._theta = parseFloat(e.target.value))}
                  className="w-full bg-[#1b2435] text-white text-center rounded p-1 border border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[12px] mt-2">
              <div>
                <label className="text-gray-400 text-[11px]">หุ้นขึ้น (USD)</label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={1.0}
                  onChange={(e) => (window._deltaMove = parseFloat(e.target.value))}
                  className="w-full bg-[#1b2435] text-white text-center rounded p-1 border border-white/10"
                />
              </div>
              <div>
                <label className="text-gray-400 text-[11px]">ผ่านไป (วัน)</label>
                <input
                  type="number"
                  step="1"
                  defaultValue={3}
                  onChange={(e) => (window._days = parseInt(e.target.value))}
                  className="w-full bg-[#1b2435] text-white text-center rounded p-1 border border-white/10"
                />
              </div>
              <div>
                <label className="text-gray-400 text-[11px]">ราคา Option ตอนนี้</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={call.premium || 0.4}
                  onChange={(e) => (window._optionNow = parseFloat(e.target.value))}
                  className="w-full bg-[#1b2435] text-white text-center rounded p-1 border border-white/10"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const Δ = window._delta || 0.2;
                const Θ = window._theta || -0.008;
                const move = window._deltaMove || 1;
                const days = window._days || 1;
                const base = window._optionNow || 0.4;
                const result = base + Δ * move + Θ * days;
                alert(`คาดว่า Option ≈ $${result.toFixed(2)} (${((result - base) / base * 100).toFixed(0)}%)`);
              }}
              className="w-full mt-2 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded text-emerald-400 font-semibold text-[12px] hover:bg-emerald-500/30 transition"
            >
              🧮 คำนวณราคา Option (Simulate)
            </button>
          </div>
        </>
      )}

      {/* ✅ AI Entry Zone */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-2 text-[11px] space-y-1">
        <div className="text-emerald-400 font-bold text-[12px]">AI Entry Zone</div>
        {rsi < 40 && "🔵 Oversold — รอการกลับตัว"}
        {rsi >= 40 && rsi <= 60 && "🟢 โซนเข้าซื้อแนะนำ"}
        {rsi > 60 && rsi <= 70 && "🟡 ถือรอดูแรงซื้อต่อเนื่อง"}
        {rsi > 70 && "🔴 Overbought — อย่าเพิ่งเข้า"}
        <div className="mt-2 h-1.5 w-full bg-[#1e293b] rounded-full overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max(rsi, 0), 100)}%`,
              background:
               rsi < 40 ? "#3b82f6" : rsi <= 60 ? "#22c55e" : rsi <= 70 ? "#eab308" : "#ef4444",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function MarketNews({ news }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3">
      <h2 className="text-[13px] font-bold mb-1 tracking-wide">Market News</h2>
      {!news?.length ? (
        <div className="text-[11px] text-gray-400">No recent news.</div>
      ) : (
        <ul className="space-y-1.5">
          {news.slice(0, 8).map((n, i) => (
            <li
              key={i}
              className="p-1.5 bg-black/20 border border-white/10 rounded-lg"
            >
              <a
                href={n.link || n.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 text-[12px] font-medium"
              >
                {n.title}
              </a>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {n.publisher || n.source || ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
        }
