// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Stock + Option Mode + Compact UI)
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../../components/Chart.js"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

export default function Analyze() {
  const { query, push } = useRouter();
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
        const infiniteRes = await fetch(`/api/visionary-infinite-core?symbol=${symbol}`).then((r) => r.json());
        const isInfiniteOk = infiniteRes && !infiniteRes.error && infiniteRes.symbol;

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
            onClick={() => push("/")}
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

        {/* News */}
        <MarketNews news={news} />
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
  if (trend === "Downtrend") score -= 0.5;

  if (score >= 3) return { action: "Buy", confidence: score / 4, reason: "แนวโน้มขาขึ้นแข็งแรง" };
  if (score <= 1) return { action: "Sell", confidence: (2 - score) / 2, reason: "แรงขายกดดัน" };
  return { action: "Hold", confidence: 0.5, reason: "สัญญาณเป็นกลาง" };
}

// ===== COMPONENTS =====
function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#141b2d] p-3 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-100">{value}</div>
    </div>
  );
}

function AISignalSection({ ind, sig, price, scanner, mode }) {
  const conf = scanner?.confidence ?? sig.confidence * 100;
  const target = scanner?.targetPrice ?? price * 1.08;
  const rsi = ind?.rsi ?? 0;

  const action =
    mode === "option"
      ? rsi > 55 && conf >= 65
        ? "Buy"
        : rsi < 40
        ? "Sell"
        : "Hold"
      : sig.action;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4 space-y-4 shadow-inner">
      {/* Signal header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">AI {mode === "option" ? "Option" : "Trade"} Signal</h2>
        <span
          className={`font-bold ${
            action === "Buy" ? "text-green-400" : action === "Sell" ? "text-red-400" : "text-yellow-300"
          }`}
        >
          {action}
        </span>
      </div>

      {/* Compact Info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="🎯 Target" value={`$${fmt(target, 2)}`} />
        <Info label="🤖 Confidence" value={`${fmt(conf, 0)}%`} />
        <Info label="📋 Reason" value={scanner?.reason || sig.reason} />
        <Info label="RSI (14)" value={fmt(rsi, 1)} />
      </div>

      {/* AI Entry Zone */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-3 text-sm">
        <div className="text-emerald-400 font-semibold mb-1">🎯 AI Entry Zone</div>
        {rsi ? (
          <div>
            {rsi < 40 && "🔵 Oversold — รอการกลับตัว"}
            {rsi >= 40 && rsi <= 60 && "🟢 โซนเข้าซื้อแนะนำ"}
            {rsi > 60 && rsi <= 70 && "🟡 ถือรอดูแรงซื้อต่อเนื่อง"}
            {rsi > 70 && "🔴 Overbought — อย่าเพิ่งเข้า"}
          </div>
        ) : (
          "⏳ Loading data..."
        )}
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

      {/* Technical Overview */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Info label="Last" value={`$${fmt(ind?.lastClose)}`} />
        <Info label="EMA20" value={fmt(ind?.ema20)} />
        <Info label="EMA50" value={fmt(ind?.ema50)} />
        <Info label="EMA200" value={fmt(ind?.ema200)} />
      </div>
    </section>
  );
}

function MarketNews({ news }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4">
      <h2 className="text-base font-semibold mb-2">Market News</h2>
      {!news?.length ? (
        <div className="text-xs text-gray-400">No recent news.</div>
      ) : (
        <ul className="space-y-2">
          {news.slice(0, 8).map((n, i) => (
            <li key={i} className="p-2 bg-black/20 border border-white/10 rounded-lg">
              <a href={n.link || n.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 text-sm">
                {n.title}
              </a>
              <div className="text-[10px] text-gray-400 mt-0.5">{n.publisher || n.source || ""}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
                                         }
