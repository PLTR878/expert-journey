// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Stock + Option + AI Entry Zone + Compact Font + TP/SL Breakout v∞.11)
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../../components/Chart.js"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

// ✅ ฟังก์ชันคำนวณ TP / SL ที่ปรับอัตโนมัติเมื่อทะลุแนวต้าน
function computeSmartTargetAndSL(data) {
  const { lastClose, ema20, ema50, ema200, rsi, trend, volume, high, low } = data;
  if (![lastClose, ema20, ema50, ema200].every(Number.isFinite)) {
    return { target: lastClose, stopLoss: lastClose * 0.95, confidence: 20, reason: "ข้อมูลไม่ครบ" };
  }

  // === ตัวแปรพื้นฐาน ===
  const emaGap20_50 = ((ema20 - ema50) / ema50) * 100;
  const emaGap50_200 = ((ema50 - ema200) / ema200) * 100;
  const emaTrendStrength = (emaGap20_50 + emaGap50_200) / 2;
  const volBoost = volume ? Math.min(volume / 1_000_000, 3) : 1;

  // === หาแนวต้านหลัก ===
  const resistances = [ema20, ema50, ema200].filter(v => v > lastClose).sort((a, b) => a - b);
  const firstRes = resistances[0] || lastClose * 1.05;
  const nextRes = resistances[1] || firstRes * 1.05;

  // === เริ่มคำนวณ TP / SL ===
  let tp = firstRes * 1.03; // TP เริ่มต้น: เหนือแนวต้านแรกเล็กน้อย
  const volumeBoost = Math.min(volBoost, 3);

  if (rsi > 60 && volumeBoost > 1.5) {
    tp = nextRes * (1.02 + (rsi - 60) / 200);
  }

  // ถ้าราคาทะลุแนวต้านแล้ว → เลื่อน TP อัตโนมัติ
  if (lastClose > firstRes) {
    tp = lastClose * (1.05 + (rsi - 50) / 300);
  }

  // === SL ===
  let slFactor = 0.96;
  if (ema20 < ema50 && ema50 < ema200) slFactor = 0.93;
  if (rsi < 35) slFactor = 0.90;
  const stopLoss = lastClose * slFactor;

  // === Confidence ===
  const confRaw =
    Math.abs(emaGap20_50 * 3) +
    Math.abs(emaGap50_200 * 2) +
    (trend === "Uptrend" ? 20 : 0) +
    (rsi >= 45 && rsi <= 65 ? 10 : 0);
  const confidence = Math.min(99, Math.max(10, confRaw));

  // === Reason ===
  let reason = "รอการยืนยันเพิ่มเติม";
  if (rsi > 70) reason = "RSI สูงเกินไป — ระวังแรงขาย";
  else if (rsi < 35) reason = "RSI ต่ำมาก — อาจมีรีบาวด์แรง";
  else if (emaTrendStrength > 2) reason = "แนวโน้มขาขึ้นแข็งแรง";
  else if (emaTrendStrength < -2) reason = "แนวโน้มอ่อนตัว";

  return { target: tp, stopLoss, confidence, reason };
}

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
        const infiniteRes = await fetch(`/api/visionary-infinite-core?symbol=${symbol}`).then(r => r.json());
        const isInfiniteOk = infiniteRes && !infiniteRes.error && infiniteRes.symbol;

        try {
          const optExtra = await fetch(`/api/visionary-option-core?symbol=${symbol}`).then(r => r.json());
          if (optExtra && !optExtra.error) setOptionAI(optExtra);
        } catch (err) {
          console.warn("⚠️ Option Core fetch fail:", err);
        }

        const smart = computeSmartTargetAndSL(infiniteRes || {});
        if (isInfiniteOk) {
          setCore(infiniteRes);
          setScanner({
            targetPrice: smart.target,
            stopLoss: smart.stopLoss,
            confidence: smart.confidence,
            reason: smart.reason,
          });
          setNews(infiniteRes.news || []);
        } else {
          const [coreRes, scannerRes, newsRes] = await Promise.all([
            fetch(`/api/visionary-core?symbol=${symbol}`).then(r => r.json()),
            fetch(`/api/visionary-scanner?symbol=${symbol}`).then(r => r.json()),
            fetch(`/api/news?symbol=${symbol}`).then(r => r.json()),
          ]);
          const smart2 = computeSmartTargetAndSL(coreRes || {});
          setCore(coreRes);
          setScanner({
            targetPrice: smart2.target,
            stopLoss: smart2.stopLoss,
            confidence: smart2.confidence,
            reason: smart2.reason,
          });
          setNews(newsRes.items || []);
        }
      } catch (e) {
        console.error("⚠️ Analyzer fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  // ===== โหลด Option AI =====
  useEffect(() => {
    if (!symbol) return;
    fetch(`/api/visionary-option-ai?symbol=${symbol}`)
      .then(r => r.json())
      .then(setOptionAI)
      .catch(e => console.error("Option AI error:", e));
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
        <div className="flex justify-between items-center">
          <button onClick={() => window.history.back()} className="text-[12px] bg-white/5 px-3 py-1 rounded border border-white/10 hover:bg-emerald-500/10">← ย้อนกลับ</button>
          <h1 className="text-[14px] font-bold tracking-widest">{symbol}</h1>
          <div className="text-emerald-400 font-semibold text-[12px] border border-emerald-400/30 rounded px-2 py-0.5">${fmt(price, 2)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0f172a]"><Chart candles={hist} markers={markers} /></div>

        <div className="flex justify-center gap-2">
          <button onClick={() => setMode("stock")} className={`px-3 py-1 rounded-md text-[12px] font-bold ${mode === "stock" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400"}`}>หุ้นธรรมดา (Stock)</button>
          <button onClick={() => setMode("option")} className={`px-3 py-1 rounded-md text-[12px] font-bold ${mode === "option" ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-400"}`}>ออปชั่น (Option)</button>
        </div>

        <AISignalSection ind={core} sig={sig} price={price} scanner={scanner} optionAI={optionAI} mode={mode} />
        <MarketNews news={news} />
      </div>
    </main>
  );
}

// ===== Logic เดิม =====
function computeSignal({ lastClose, ema20, ema50, ema200, rsi, trend }) {
  if (![lastClose, ema20, ema50, ema200, rsi].every(Number.isFinite))
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

// ===== UI เดิม =====
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
  const stopLoss = scanner?.stopLoss ?? price * 0.95;
  const reason = scanner?.reason || sig.reason;
  const showOption = mode === "option";
  const action = showOption ? optionAI?.signal || sig.action : sig.action;
  const conf = showOption ? optionAI?.confidence || baseConf : baseConf;
  const call = optionAI?.topCall || { strike: "-", premium: "-", roi: "-" };
  const put = optionAI?.topPut || { strike: "-", premium: "-", roi: "-" };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-3 space-y-3 shadow-inner">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[13px] font-bold tracking-widest">AI {showOption ? "Option" : "Trade"} Signal</h2>
        <span className={`font-bold ${action === "Buy" ? "text-green-400" : action === "Sell" ? "text-red-400" : "text-yellow-300"}`}>{action}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[12px]">
        <Info label="🎯 Target (TP)" value={`$${fmt(target, 2)}`} />
        <Info label="🛑 Stop Loss" value={`$${fmt(stopLoss, 2)}`} />
        <Info label="🤖 Confidence" value={`${fmt(conf, 0)}%`} />
        <Info label="📋 Reason" value={reason} />
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-2">
        <h3 className="text-emerald-400 font-semibold mb-1 text-[11px]">EMA Overview</h3>
        <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center">
          <Info label="Last" value={`$${fmt(ind?.lastClose)}`} />
          <Info label="EMA20" value={fmt(ind?.ema20)} />
          <Info label="EMA50" value={fmt(ind?.ema50)} />
          <Info label="EMA200" value={fmt(ind?.ema200)} />
        </div>
      </div>

      {showOption && (
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
        </div>
      )}
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
            <li key={i} className="p-1.5 bg-black/20 border border-white/10 rounded-lg">
              <a href={n.link || n.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 text-[12px] font-medium">
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
