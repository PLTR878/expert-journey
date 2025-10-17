import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const Chart = dynamic(() => import('../../components/Chart'), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : '-');

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
  const [status, setStatus] = useState({ online: true, lastUpdate: null });

  // ✅ ดึงข้อมูลจาก /api/daily.js + /api/news2.js
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const [daily, n] = await Promise.all([
          fetch(`/api/daily?symbol=${symbol}`).then(r => r.json()),
          fetch(`/api/news2?symbol=${symbol}`).then(r => r.json()),
        ]);
        setInd(daily);
        setNews(n.results || n.items || []);
        setStatus({ online: true, lastUpdate: new Date().toLocaleTimeString() });
      } catch (e) {
        console.error(e);
        setStatus({ online: false, lastUpdate: new Date().toLocaleTimeString() });
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

  // ✅ Auto Refresh ทุก 60 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      if (symbol) {
        fetch(`/api/daily?symbol=${symbol}`)
          .then(r => r.json())
          .then(setInd)
          .catch(console.error);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [symbol]);

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

        {/* ===== SYSTEM STATUS ===== */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#141b2d] px-4 py-3">
          <div className="text-sm text-gray-300">
            ⚙️ System Status:{" "}
            {status.online ? (
              <span className="text-green-400 font-semibold">Online</span>
            ) : (
              <span className="text-red-400 font-semibold">Offline</span>
            )}
          </div>
          <div className="text-xs text-gray-400">Last Update: {status.lastUpdate || '—'}</div>
        </div>

        {/* ===== HEADER + CHART ===== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.05),inset_0_-6px_15px_rgba(0,0,0,0.7)]"></div>

          <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between text-gray-200 select-none">
            <button
              onClick={() => push('/')}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
            >
              <span className="text-lg leading-none">←</span>
              <span>ย้อนกลับ</span>
            </button>

            <div className="flex-1 text-center">
              <span className="text-[18px] font-bold tracking-wide text-white">{symbol || '—'}</span>
              <span className="ml-1 text-[14px] text-gray-400 font-light">— การวิเคราะห์เรียลไทม์</span>
            </div>

            <div className="text-right text-[15px] font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
              ${fmt(price, 2)}
            </div>
          </div>

          <div className="relative z-0 pt-14">
            <Chart candles={hist} markers={markers} />
          </div>
        </div>

        {/* ===== AI SIGNAL + TECHNICAL ===== */}
        <AISignalSection ind={ind} sig={sig} price={price} loading={loading} />

        {/* ===== MARKET NEWS ===== */}
        <MarketNews news={news} />

        {/* ===== REALTIME SCAN + GALAXY MAP ===== */}
        <AIShortList />
        <AIGalaxyMap />

      </div>
    </main>
  );
}

/* ✅ Market News */
function MarketNews({ news }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[18px] font-semibold tracking-wide text-white/90">Market News</h2>
      </div>
      {!news?.length && <div className="text-sm text-gray-400">No recent news.</div>}
      <ul className="mt-3 space-y-2">
        {news?.slice(0, 12).map((n, i) => (
          <li key={i} className="rounded-xl p-3 bg-black/25 border border-white/10 hover:border-emerald-400/30 hover:bg-white/5 transition-all duration-300">
            <a href={n.url || n.link} target="_blank" rel="noreferrer" className="block font-medium text-[15px] leading-snug hover:text-emerald-400 transition">
              {n.title || n.headline}
            </a>
            <div className="text-xs text-gray-400 mt-1 border-t border-white/5 pt-1">
              {(n.source || n.publisher || '').toString()} • {(n.date || n.publishedAt || '').toString()}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ✅ AI ShortList (อัปเกรดเรียลไทม์) */
function AIShortList() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/screener2');
        const j = await r.json();
        const top = (j.results || [])
          .filter(x => x.signal === 'Buy' && x.confidence > 0.6)
          .slice(0, 5);
        setList(top);
      } catch {
        console.warn('Screener API unavailable');
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 mt-10">
      <h2 className="text-lg font-semibold text-emerald-400 mb-3">🔥 AI Stocks To Watch</h2>
      {!list.length && <div className="text-gray-400 text-sm">Loading AI signals...</div>}
      <ul className="space-y-2">
        {list.map((s, i) => (
          <li key={i} className="flex justify-between items-center border border-white/10 rounded-xl px-3 py-2 bg-[#141b2d]">
            <Link href={`/analyze/${s.symbol}`} className="text-white font-bold">
              {s.symbol}
            </Link>
            <span className="text-gray-400 text-sm">Conf: {(s.confidence * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ✅ Galaxy Trend Map (อัปเกรดสุ่มจากข้อมูลจริงบางส่วน) */
function AIGalaxyMap() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/screener2')
      .then(r => r.json())
      .then(j => {
        const all = j.results || [];
        const mapped = all.slice(0, 100).map((x, i) => ({
          color:
            x.signal === 'Buy'
              ? '#22c55e'
              : x.signal === 'Sell'
              ? '#ef4444'
              : '#facc15',
        }));
        setData(mapped);
      })
      .catch(() => {
        // fallback ถ้า API ล่ม
        setData(Array.from({ length: 100 }).map((_, i) => ({
          color: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#facc15' : '#ef4444',
        })));
      });
  }, []);

  return (
    <section className="mt-10 bg-[#141b2d] p-6 rounded-2xl border border-white/10">
      <h2 className="text-lg font-semibold text-emerald-400 mb-4 text-center">🌌 AI Galaxy Trend Map</h2>
      <div className="grid grid-cols-10 gap-[3px]">
        {data.map((b, i) => (
          <div key={i} className="w-5 h-5 rounded-sm" style={{ background: b.color, opacity: 0.9 }}></div>
        ))}
      </div>
      <div className="flex justify-center gap-5 mt-3 text-xs text-gray-400">
        <div>🟢 Uptrend</div>
        <div>🟡 Sideway</div>
        <div>🔴 Downtrend</div>
      </div>
    </section>
  );
                }
