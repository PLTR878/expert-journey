import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Chart = dynamic(() => import("../../components/Chart"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

function computeSignal({ lastClose, ema20, ema50, rsi, macd }) {
  if (
    ![lastClose, ema20, ema50, rsi, macd?.hist, macd?.line, macd?.signal].every(
      (v) => Number.isFinite(v)
    )
  ) {
    return {
      action: "Hold",
      confidence: 0.5,
      reason: "ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์",
    };
  }
  let score = 0;
  if (lastClose > ema20) score += 1;
  if (ema20 > ema50) score += 1;
  if (macd.hist > 0) score += 1;
  if (macd.line > macd.signal) score += 1;
  if (rsi > 50) score += 1;

  if (score >= 4)
    return {
      action: "Buy",
      confidence: score / 5,
      reason: "แนวโน้มขาขึ้น (Bullish Momentum)",
    };
  if (score <= 1)
    return {
      action: "Sell",
      confidence: (2 - score) / 2,
      reason: "แรงขายกดดัน (Bearish Pressure)",
    };
  return { action: "Hold", confidence: 0.5, reason: "สัญญาณเป็นกลาง (Neutral)" };
}

export default function Analyze() {
  const { query, push } = useRouter();
  const symbol = (query.symbol || "").toString().toUpperCase();
  const [hist, setHist] = useState([]);
  const [ind, setInd] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanSummary, setScanSummary] = useState(null);

  // ✅ ดึงข้อมูลหลัก
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
        console.error("Data fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  // ✅ ดึงกราฟแท่งเทียน
  useEffect(() => {
    if (!symbol) return;
    fetch(`/api/history?symbol=${symbol}&range=6mo&interval=1d`)
      .then((r) => r.json())
      .then((h) => setHist(h.rows || []))
      .catch(console.error);
  }, [symbol]);

  // ✅ ระบบสแกนหุ้นทั้งตลาด (background ทุก 1 ชม.)
  useEffect(() => {
    const scanAll = async () => {
      try {
        const res = await fetch("/api/scan");
        const data = await res.json();
        setScanSummary({
          total: data.total || data.length || 0,
          updated: new Date().toLocaleTimeString(),
        });
      } catch (e) {
        console.error("Scan error:", e);
      }
    };
    scanAll();
    const timer = setInterval(scanAll, 3600000);
    return () => clearInterval(timer);
  }, []);

  const markers = useMemo(() => {
    if (!ind || !hist?.length) return [];
    const last = hist.at(-1)?.t;
    const t = Math.floor((last || Date.now()) / 1000);
    const sig = computeSignal(ind);
    if (sig.action === "Buy")
      return [
        {
          time: t,
          position: "belowBar",
          color: "#22c55e",
          shape: "arrowUp",
          text: `BUY ${symbol}`,
        },
      ];
    if (sig.action === "Sell")
      return [
        {
          time: t,
          position: "aboveBar",
          color: "#ef4444",
          shape: "arrowDown",
          text: `SELL ${symbol}`,
        },
      ];
    return [
      {
        time: t,
        position: "inBar",
        color: "#facc15",
        shape: "circle",
        text: `HOLD ${symbol}`,
      },
    ];
  }, [JSON.stringify(ind), hist?.length]);

  const sig = computeSignal(ind || {});
  const price = ind?.lastClose || hist?.at(-1)?.c || 0;

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ===== Header + Chart ===== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] border border-white/10 overflow-hidden">
          <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10">
            <button
              onClick={() => push("/")}
              className="text-gray-400 hover:text-white text-sm flex gap-1 items-center"
            >
              ← <span>ย้อนกลับ</span>
            </button>
            <div className="text-center">
              <span className="text-lg font-bold">{symbol || "—"}</span>
              <span className="ml-1 text-gray-400 text-sm">
                — การวิเคราะห์เรียลไทม์
              </span>
            </div>
            <div className="bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-lg text-emerald-400 font-semibold">
              ${fmt(price, 2)}
            </div>
          </div>
          <div className="pt-12">
            <Chart candles={hist} markers={markers} />
          </div>
        </div>

        {/* ===== AI SIGNAL + ENTRY ZONE + TECHNICAL ===== */}
        <AISignalSection ind={ind} sig={sig} price={price} loading={loading} />

        {/* ===== Market News ===== */}
        <MarketNews news={news} />

        {/* ===== AI ShortList ===== */}
        <AIShortList />

        {/* ===== Galaxy Trend Map ===== */}
        <AIGalaxyMap />

        {/* ===== Scan Summary ===== */}
        {scanSummary && (
          <div className="text-center text-sm text-gray-400 mt-4">
            ✅ สแกนตลาดล่าสุด: {scanSummary.total} หุ้น | เวลา{" "}
            {scanSummary.updated}
          </div>
        )}
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

function AISignalSection({ ind, sig, price, loading }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5 shadow-inner space-y-6">
      {/* Trade Signal */}
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
          <Info
            label="🎯 Target Price"
            value={`$${fmt(ind?.targetPrice ?? price * 1.08, 2)}`}
          />
          <Info
            label="🤖 Confidence"
            value={`${fmt(
              ind?.confidencePercent ?? sig.confidence * 100,
              0
            )}%`}
          />
          <Info
            label="📋 Reason"
            value={ind?.trend || sig.reason}
            className="col-span-2"
          />
        </div>
      </div>

      {/* Entry Zone */}
      <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-4">
        <h3 className="text-lg font-semibold text-emerald-400 mb-2">
          🎯 AI Entry Zone
        </h3>
        <div className="text-sm font-semibold text-gray-300">
          {(() => {
            const rsi = ind?.rsi ?? 0;
            const ai = sig.action;
            if (!rsi) return "⏳ Loading Entry Zone...";
            const low = (price * 0.98).toFixed(2);
            const high = (price * 1.02).toFixed(2);
            if (ai === "Buy" && rsi >= 45 && rsi <= 60)
              return `🟢 เข้าได้! โซนซื้อ AI (${low} - ${high}) | RSI ${rsi.toFixed(
                1
              )}`;
            if (rsi > 60 && rsi <= 70)
              return "🟡 Hold — รอดูแรงซื้อต่อเนื่องก่อน";
            if (rsi > 70) return "🔴 Overbought — อย่าเพิ่งเข้า!";
            if (rsi < 40) return "🔵 Oversold — รอการกลับตัว";
            return "⚪ รอสัญญาณยืนยัน — ยังไม่เข้าโซนซื้อ";
          })()}
        </div>

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

      {/* Technical */}
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
            <li
              key={i}
              className="p-3 bg-black/25 border border-white/10 rounded-lg"
            >
              <a
                href={n.url || n.link}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400"
              >
                {n.title || n.headline}
              </a>
              <div className="text-xs text-gray-400 mt-1">
                {n.source || n.publisher || ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
