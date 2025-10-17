import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const Chart = dynamic(() => import('../../components/Chart'), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : '-');

// 🧠 ฟังก์ชันประมวลผลสัญญาณ AI
function computeSignal({ lastClose, ema20, ema50, rsi, macd }) {
  if (![lastClose, ema20, ema50, rsi, macd?.hist, macd?.line, macd?.signal].every(v => Number.isFinite(v))) {
    return { action: 'Hold', confidence: 0.5, reason: 'ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์' };
  }
  let score = 0;
  if (lastClose > ema20) score += 1;
  if (ema20 > ema50) score += 1;
  if (macd.hist > 0) score += 1;
  if (macd.line > macd.signal) score += 1;
  if (rsi > 50) score += 1;

  if (score >= 4) return { action: 'Buy', confidence: score / 5, reason: 'แนวโน้มขาขึ้น (Bullish Momentum)' };
  if (score <= 1) return { action: 'Sell', confidence: (2 - score) / 2, reason: 'แรงขายกดดัน (Bearish Pressure)' };
  return { action: 'Hold', confidence: 0.5, reason: 'สัญญาณเป็นกลาง (Neutral)' };
}

export default function Analyze() {
  const { query, push } = useRouter();
  const symbol = (query.symbol || '').toString().toUpperCase();
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
          fetch(`/api/daily?symbol=${symbol}`).then(r => r.json()),
          fetch(`/api/news?symbol=${symbol}`).then(r => r.json())
        ]);
        setInd(daily);
        setNews(n.items || n.results || []);
      } catch (e) {
        console.error('Data fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  // ✅ ดึงกราฟแท่งเทียน
  useEffect(() => {
    if (!symbol) return;
    fetch(`/api/history?symbol=${symbol}&range=6mo&interval=1d`)
      .then(r => r.json())
      .then(h => setHist(h.rows || []))
      .catch(console.error);
  }, [symbol]);

  // ✅ ระบบสแกนหุ้นทั้งตลาด (background ทุก 1 ชม.)
  useEffect(() => {
    const scanAll = async () => {
      try {
        const res = await fetch('/api/scan');
        const data = await res.json();
        setScanSummary({ total: data.total || data.length || 0, updated: new Date().toLocaleTimeString() });
      } catch (e) {
        console.error('Scan error:', e);
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
    if (sig.action === 'Buy')
      return [{ time: t, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: `BUY ${symbol}` }];
    if (sig.action === 'Sell')
      return [{ time: t, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: `SELL ${symbol}` }];
    return [{ time: t, position: 'inBar', color: '#facc15', shape: 'circle', text: `HOLD ${symbol}` }];
  }, [JSON.stringify(ind), hist?.length]);

  const sig = computeSignal(ind || {});
  const price = ind?.lastClose || hist?.at(-1)?.c || 0;

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ===== Header + Chart ===== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] border border-white/10 overflow-hidden">
          <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10">
            <button onClick={() => push('/')} className="text-gray-400 hover:text-white text-sm flex gap-1 items-center">
              ← <span>ย้อนกลับ</span>
            </button>
            <div className="text-center">
              <span className="text-lg font-bold">{symbol || '—'}</span>
              <span className="ml-1 text-gray-400 text-sm">— การวิเคราะห์เรียลไทม์</span>
            </div>
            <div className="bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-lg text-emerald-400 font-semibold">
              ${fmt(price, 2)}
            </div>
          </div>
          <div className="pt-12">
            <Chart candles={hist} markers={markers} />
          </div>
        </div>

        {/* ===== AI SIGNAL ===== */}
        <AISignalSection ind={ind} sig={sig} price={price} loading={loading} />

        {/* ===== News ===== */}
        <MarketNews news={news} />

        {/* ===== Watchlist ===== */}
        <AIShortList />

        {/* ===== Trend Map ===== */}
        <AIGalaxyMap />

        {/* ===== Scan Summary ===== */}
        {scanSummary && (
          <div className="text-center text-sm text-gray-400 mt-4">
            ✅ สแกนตลาดล่าสุด: {scanSummary.total} หุ้น | เวลา {scanSummary.updated}
          </div>
        )}
      </div>
    </main>
  );
}

// ---------- COMPONENTS ---------- //
function Info({ label, value, className = '' }) {
  const color = value?.includes('%')
    ? value.includes('-')
      ? 'text-red-400'
      : 'text-emerald-400'
    : 'text-gray-100';
  return (
    <div className={`rounded-xl border border-white/10 bg-[#141b2d] p-4 text-center ${className}`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function AISignalSection({ ind, sig, price, loading }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5 shadow-inner">
      <div className="flex justify-between mb-3">
        <h2 className="text-lg font-semibold">AI Trade Signal</h2>
        <span className={sig.action === 'Buy' ? 'text-green-400' : sig.action === 'Sell' ? 'text-red-400' : 'text-yellow-300'}>
          {sig.action === 'Buy' ? 'ซื้อ (Buy)' : sig.action === 'Sell' ? 'ขาย (Sell)' : 'ถือ (Hold)'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Info label="🎯 Target Price" value={`$${fmt(ind?.targetPrice ?? price * 1.08, 2)}`} />
        <Info label="🤖 Confidence" value={`${fmt(ind?.confidencePercent ?? sig.confidence * 100, 0)}%`} />
        <Info label="📋 Reason" value={ind?.trend || sig.reason} className="col-span-2" />
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
          {news.slice(0, 8).map((n, i) => (
            <li key={i} className="p-3 bg-black/25 border border-white/10 rounded-lg">
              <a href={n.url || n.link} target="_blank" rel="noreferrer" className="hover:text-emerald-400">
                {n.title || n.headline}
              </a>
              <div className="text-xs text-gray-400 mt-1">{n.source || n.publisher || ''}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AIShortList() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const load = async () => {
      const r = await fetch('/api/screener-hybrid?horizon=short&limit=50');
      const j = await r.json();
      const top = (j.results || []).filter(x => x.signal === 'Buy' && x.confidence > 0.6).slice(0, 6);
      setList(top);
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-5">
      <h2 className="text-lg font-semibold text-emerald-400 mb-3">🔥 AI Stocks To Watch</h2>
      <ul className="space-y-2">
        {list.map((s, i) => (
          <li key={i} className="flex justify-between border border-white/10 bg-[#0b1220] rounded-lg px-3 py-2">
            <Link href={`/analyze/${s.symbol}`} className="text-white font-bold">{s.symbol}</Link>
            <span className="text-gray-400 text-sm">Conf: {(s.confidence * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AIGalaxyMap() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-6 mt-6">
      <h2 className="text-lg font-semibold text-center text-emerald-400 mb-4">🌌 AI Galaxy Trend Map</h2>
      <div className="grid grid-cols-10 gap-[3px]">
        {Array.from({ length: 100 }).map((_, i) => {
          const c = i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#facc15' : '#ef4444';
          return <div key={i} className="w-5 h-5 rounded-sm" style={{ background: c, opacity: 0.85 }}></div>;
        })}
      </div>
      <div className="flex justify-center gap-5 text-xs text-gray-400 mt-3">
        <span>🟢 Uptrend</span>
        <span>🟡 Sideway</span>
        <span>🔴 Downtrend</span>
      </div>
    </section>
  );
      }
