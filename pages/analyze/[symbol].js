// ✅ /pages/analyze/[symbol].js — Ultra Clean Fixed Layout + EMA Restored
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../../components/Chart"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

function computeSignal({ lastClose, ema20, ema50, ema200, rsi, macd }) {
  if (
    ![lastClose, ema20, ema50, ema200, rsi, macd?.hist, macd?.line, macd?.signal].every(
      (v) => Number.isFinite(v)
    )
  ) {
    return { action: "Hold", confidence: 0.5, reason: "ข้อมูลไม่เพียงพอ" };
  }

  let score = 0;
  if (lastClose > ema20) score++;
  if (ema20 > ema50) score++;
  if (ema50 > ema200) score++;
  if (macd.hist > 0) score++;
  if (rsi > 50) score++;

  if (score >= 4) return { action: "Buy", confidence: score / 5, reason: "แนวโน้มขาขึ้น" };
  if (score <= 1) return { action: "Sell", confidence: (2 - score) / 2, reason: "แรงขายกดดัน" };
  return { action: "Hold", confidence: 0.5, reason: "สัญญาณเป็นกลาง" };
}

export default function Analyze() {
  const { query, push } = useRouter();
  const symbol = (query.symbol || "").toString().toUpperCase();
  const [hist, setHist] = useState([]);
  const [ind, setInd] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ โหลดข้อมูลหลัก
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const [daily, n] = await Promise.all([
          fetch(`/api/daily?symbol=${symbol}`).then((r) => r.json()),
          fetch(`/api/news?symbol=${symbol}`).then((r) => r.json()),
        ]);
        setInd(daily);
        setNews(n.items || n.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  // ✅ โหลดกราฟแท่งเทียน
  useEffect(() => {
    if (!symbol) return;
    fetch(`/api/history?symbol=${symbol}&range=6mo&interval=1d`)
      .then((r) => r.json())
      .then((h) => setHist(h.rows || []))
      .catch(console.error);
  }, [symbol]);

  const sig = computeSignal(ind || {});
  const price = ind?.lastClose || hist?.at(-1)?.c || 0;

  const markers = useMemo(() => {
    if (!ind || !hist.length) return [];
    const t = Math.floor((hist.at(-1)?.t || Date.now()) / 1000);
    if (sig.action === "Buy")
      return [{ time: t, position: "belowBar", color: "#22c55e", shape: "arrowUp", text: "BUY" }];
    if (sig.action === "Sell")
      return [{ time: t, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: "SELL" }];
    return [{ time: t, position: "inBar", color: "#eab308", shape: "circle", text: "HOLD" }];
  }, [JSON.stringify(ind), hist.length]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ===== Header + Chart ===== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] border border-white/10 overflow-hidden shadow-xl">
          {/* ===== Header ===== */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-start px-3 pt-3 z-10">
            {/* ปุ่มย้อนกลับ */}
            <button
              onClick={() => push("/")}
              className="flex items-center gap-1 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-xl px-3 py-1 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all shadow-sm"
            >
              <span className="text-lg">←</span>
              <span>ย้อนกลับ</span>
            </button>

            {/* ชื่อหุ้นกลาง */}
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 text-center">
              <h1 className="text-xl font-extrabold text-white tracking-widest drop-shadow-[0_0_8px_rgba(16,255,194,0.5)]">
                {symbol || "—"}
              </h1>
            </div>

            {/* ราคาหุ้น */}
            <div className="ml-auto bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-bold px-3 py-1 rounded-xl shadow-md mt-[-2px]">
              ${fmt(price, 2)}
            </div>
          </div>

          <div className="pt-12">
            <Chart candles={hist} markers={markers} />
          </div>
        </div>

        {/* ===== AI SIGNAL + AI ZONE + TECHNICAL ===== */}
        <AISignalSection ind={ind} sig={sig} price={price} loading={loading} />

        {/* ===== ข่าวตลาด ===== */}
        <MarketNews news={news} />
      </div>
    </main>
  );
}

/* ---------- COMPONENTS ---------- */
function Info({ label, value, className = "" }) {
  const color = value?.includes("%")
    ? value.includes("-")
      ? "text-red-400"
      : "text-emerald-400"
    : "text-gray-100";
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#141b2d] p-4 text-center ${className}`}
    >
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
            {sig.action === "Buy"
              ? "ซื้อ (Buy)"
              : sig.action === "Sell"
              ? "ขาย (Sell)"
              : "ถือ (Hold)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Info label="🎯 Target Price" value={`$${fmt(ind?.targetPrice ?? price * 1.08, 2)}`} />
          <Info label="🤖 Confidence" value={`${fmt(ind?.confidencePercent ?? sig.confidence * 100, 0)}%`} />
          <Info label="📋 Reason" value={ind?.trend || sig.reason} className="col-span-2" />
        </div>
      </div>

      {/* ===== AI ENTRY ZONE ===== */}
      <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-4 mt-4">
        <h3 className="text-lg font-semibold text-emerald-400 mb-2">🎯 AI Entry Zone</h3>
        <div className="text-sm font-semibold text-gray-300">
          {(() => {
            const rsi = ind?.rsi ?? 0;
            const ai = sig.action;
            const low = (price * 0.98).toFixed(2);
            const high = (price * 1.02).toFixed(2);
            if (!rsi) return "⏳ Loading data...";
            if (ai === "Buy" && rsi >= 45 && rsi <= 60)
              return `🟢 โซนเข้าซื้อแนะนำ (${low} - ${high}) | RSI ${rsi.toFixed(1)}`;
            if (rsi > 60 && rsi <= 70) return "🟡 ถือรอดูแรงซื้อต่อเนื่อง";
            if (rsi > 70) return "🔴 Overbought — อย่าเพิ่งเข้า!";
            if (rsi < 40) return "🔵 Oversold — รอการกลับตัว";
            return "⚪ รอสัญญาณยืนยันเพิ่มเติม";
          })()}
        </div>

        {/* RSI Progress */}
        <div className="mt-3 h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max(ind?.rsi ?? 0, 0), 100)}%`,
              background:
                ind?.rsi < 40
                  ? "#3b82f6"
                  : ind?.rsi <= 60
                  ? "#22c55e"
                  : ind?.rsi <= 70
                  ? "#eab308"
                  : "#ef4444",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>30</span>
          <span>50</span>
          <span>70</span>
        </div>
      </div>

      {/* ===== Technical Overview ===== */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Technical Overview</h2>
        {!ind ? (
          <div className="text-sm text-gray-400">Loading data...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Info label="Last Close" value={`$${fmt(ind.lastClose)}`} />
            <Info label="RSI (14)" value={fmt(ind.rsi, 1)} />
            <Info label="EMA 20" value={fmt(ind.ema20)} />
            <Info label="EMA 50" value={fmt(ind.ema50)} />
            <Info label="EMA 200" value={fmt(ind.ema200)} />
            <Info label="MACD Line" value={fmt(ind.macd?.line)} />
            <Info label="MACD Signal" value={fmt(ind.macd?.signal)} />
            <Info label="MACD Histogram" value={fmt(ind.macd?.hist)} />
            <Info label="ATR (14)" value={fmt(ind.atr14, 3)} />
          </div>
        )}
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
              <a href={n.url || n.link} target="_blank" rel="noreferrer" className="hover:text-emerald-400">
                {n.title || n.headline}
              </a>
              <div className="text-xs text-gray-400 mt-1">{n.source || n.publisher || ""}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
