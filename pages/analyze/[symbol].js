// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Hybrid + Dual Signal System)
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
  const [loading, setLoading] = useState(true);

  // ✅ ดึงข้อมูลจากทุก API พร้อมกัน (รวม infinite-core ด้วย)
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

  const sig = computeSignal(core || {});
  const price = core?.lastClose || 0;

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
        <AISignalSection ind={core} sig={sig} price={price} scanner={scanner} />

        {/* ✅ NEW: Dual System Summary */}
        <AITradeSummary core={core} scanner={scanner} />

        {/* ข่าว */}
        <MarketNews news={news} />
      </div>
    </main>
  );
}

// ===== AI Logic =====
function computeSignal({ lastClose, ema20, ema50, ema200, rsi, trend }) {
  if (![lastClose, ema20, ema50, ema200, rsi].every((v) => Number.isFinite(v))) {
    return { action: "Hold", confidence: 0.5, reason: "ข้อมูลไม่เพียงพอ" };
  }

  let score = 0;
  if (lastClose > ema20) score++;
  if (ema20 > ema50) score++;
  if (ema50 > ema200) score++;
  if (rsi > 55) score++;
  if (trend === "Uptrend") score += 0.5;
  if (trend === "Downtrend") score -= 0.5;

  if (score >= 3) return { action: "Buy", confidence: score / 4, reason: "แนวโน้มขาขึ้น" };
  if (score <= 1) return { action: "Sell", confidence: (2 - score) / 2, reason: "แรงขายกดดัน" };
  return { action: "Hold", confidence: 0.5, reason: "สัญญาณเป็นกลาง" };
}

// ===== UI =====
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

function AISignalSection({ ind, sig, price, scanner }) {
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
          <Info label="🎯 Target Price" value={`$${fmt(scanner?.targetPrice ?? price * 1.08, 2)}`} />
          <Info label="🤖 Confidence" value={`${fmt(scanner?.confidence ?? sig.confidence * 100, 0)}%`} />
          <Info label="📋 Reason" value={scanner?.reason || ind?.trend || sig.reason} className="col-span-2" />
        </div>
      </div>
    </section>
  );
}

function AITradeSummary({ core, scanner }) {
  const data = core || {};
  const price = data.lastClose ?? 0;
  const rsi = data.rsi ?? 0;
  const ema20 = data.ema20 ?? 0;
  const ema50 = data.ema50 ?? 0;
  const conf = scanner?.confidence ?? 50;

  const getSignal = (type) => {
    if (type === "stock") {
      if (rsi > 60 && price > ema20 && conf >= 60) return "Buy";
      if (rsi < 40 && price < ema50) return "Sell";
      return "Hold";
    } else if (type === "option") {
      if (rsi > 55 && price > ema20 && conf >= 65) return "Buy";
      if (rsi < 40) return "Sell";
      return "Hold";
    }
    return "Hold";
  };

  const stockSig = getSignal("stock");
  const optionSig = getSignal("option");

  const summaryText =
    stockSig === "Buy" && optionSig === "Buy"
      ? "✅ หุ้นและออปชั่นเข้าได้พร้อมกัน (Momentum แข็งแรง)"
      : stockSig === "Buy" && optionSig === "Hold"
      ? "⚡ เข้าได้เฉพาะหุ้นธรรมดา (Option ยังรอจังหวะ)"
      : stockSig === "Hold" && optionSig === "Buy"
      ? "⚠️ Option เข้าได้ก่อน หุ้นยังไม่ยืนยัน"
      : stockSig === "Sell" && optionSig === "Sell"
      ? "❌ ไม่ควรเข้า ทั้งหุ้นและ Option อยู่ในขาลง"
      : "⏸ รอสัญญาณยืนยันเพิ่มเติม";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5 shadow-inner space-y-4">
      <h2 className="text-lg font-semibold text-emerald-400">🧠 AI Dual Signal Summary</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-emerald-400/30 rounded-lg p-3">
          <h3 className="font-bold text-white mb-1">หุ้นธรรมดา (Stock)</h3>
          <p
            className={`text-lg font-extrabold ${
              stockSig === "Buy"
                ? "text-green-400"
                : stockSig === "Sell"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {stockSig}
          </p>
        </div>

        <div className="border border-pink-400/30 rounded-lg p-3">
          <h3 className="font-bold text-white mb-1">ออปชั่น (Option)</h3>
          <p
            className={`text-lg font-extrabold ${
              optionSig === "Buy"
                ? "text-green-400"
                : optionSig === "Sell"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {optionSig}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-300">{summaryText}</p>

      <div className="flex justify-around mt-3">
        <button className="px-4 py-2 bg-green-500/20 border border-green-400 rounded-lg font-bold hover:bg-green-600/30">
          ซื้อหุ้น (Stock)
        </button>
        <button className="px-4 py-2 bg-pink-500/20 border border-pink-400 rounded-lg font-bold hover:bg-pink-600/30">
          ซื้อออปชั่น (Option)
        </button>
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
              <a href={n.link || n.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400">
                {n.title}
              </a>
              <div className="text-xs text-gray-400 mt-1">{n.publisher || n.source || ""}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
      }
