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
  const [lastUpdate, setLastUpdate] = useState(null);

  // ✅ ดึงข้อมูลทุก 60 วิ
  useEffect(() => {
    if (!symbol) return;
    const load = async () => {
      setLoading(true);
      try {
        const [daily, n] = await Promise.all([
          fetch(`/api/daily?symbol=${symbol}`).then(r => r.json()),
          fetch(`/api/news?symbol=${symbol}`).then(r => r.json())
        ]);
        setInd(daily);
        setNews(n.results || n.items || []);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (e) {
        console.error('Fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [symbol]);

  // ✅ กราฟแท่งเทียน
  useEffect(() => {
    if (!symbol) return;
    fetch(`/api/history?symbol=${symbol}&range=6mo&interval=1d`)
      .then(r => r.json())
      .then(h => setHist(h.rows || []))
      .catch(console.error);
  }, [symbol]);

  const markers = useMemo(() => {
    if (!ind || !hist?.length) return [];
    const last = hist.at(-1)?.t;
    const t = Math.floor((last || Date.now()) / 1000);
    const sig = computeSignal(ind);
    if (sig.action === 'Buy') return [{ time: t, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: `BUY ${symbol}` }];
    if (sig.action === 'Sell') return [{ time: t, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: `SELL ${symbol}` }];
    return [{ time: t, position: 'inBar', color: '#facc15', shape: 'circle', text: `HOLD ${symbol}` }];
  }, [JSON.stringify(ind), hist?.length]);

  const sig = computeSignal(ind || {});
  const price = ind?.lastClose || hist?.at(-1)?.c || 0;

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ===== HEADER ===== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] overflow-hidden border border-white/10 shadow">
          <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between text-gray-200 select-none">
            <button onClick={() => push('/')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition">
              <span className="text-lg leading-none">←</span><span>ย้อนกลับ</span>
            </button>
            <div className="flex-1 text-center">
              <span className="text-[18px] font-bold text-white">{symbol || '—'}</span>
              <span className="ml-1 text-[14px] text-gray-400 font-light">— การวิเคราะห์เรียลไทม์</span>
            </div>
            <div className="text-right text-[15px] font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20 shadow">
              ${fmt(price, 2)}
            </div>
          </div>
          <div className="relative z-0 pt-14"><Chart candles={hist} markers={markers} /></div>
        </div>

        {/* ===== AI SIGNAL ===== */}
        <AISignalSection ind={ind} sig={sig} price={price} loading={loading} />

        {/* ===== MARKET NEWS ===== */}
        <MarketNews news={news} />

        {/* ===== AI STOCK LIST + MAP ===== */}
        <AIShortList />
        <AIGalaxyMap />

        {/* ===== SYSTEM MONITOR ===== */}
        <section className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-gray-300 text-center">
          <div>🧠 ระบบทำงาน: <span className="text-emerald-400 font-semibold">{loading ? 'กำลังอัปเดต...' : 'พร้อมใช้งาน'}</span></div>
          <div>🕒 อัปเดตล่าสุด: {lastUpdate || '—'}</div>
          <div>🔄 รีเฟรชทุก 60 วินาทีอัตโนมัติ</div>
        </section>

      </div>
    </main>
  );
}

/* ✅ Info Box */
function Info({ label, value, className = '' }) {
  const color = value?.includes('%') ? (value.includes('-') ? 'text-red-400' : 'text-emerald-400') : 'text-gray-100';
  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-b from-[#141b2d] to-[#0b1220] p-4 flex flex-col items-center text-center shadow-inner ${className}`}>
      <div className="text-[11px] text-gray-400 mb-2">{label}</div>
      <div className={`text-[17px] font-bold ${color}`}>{value}</div>
    </div>
  );
}

/* ✅ AI SIGNAL SECTION */
function AISignalSection({ ind, sig, price, loading }) {
  const rsi = ind?.rsi ?? 0;
  const low = (price * 0.98).toFixed(2);
  const high = (price * 1.02).toFixed(2);

  const entryText = !rsi
    ? "⏳ Loading Entry Zone..."
    : sig.action === "Buy" && rsi >= 45 && rsi <= 60
    ? `🟢 เข้าได้! โซนซื้อ AI (${low}-${high}) | RSI ${rsi.toFixed(1)}`
    : rsi > 60 && rsi <= 70
    ? "🟡 Hold — รอดูแรงซื้อต่อเนื่อง"
    : rsi > 70
    ? "🔴 Overbought — อย่าเพิ่งเข้า!"
    : rsi < 40
    ? "🔵 Oversold — รอการกลับตัว"
    : "⚪ รอสัญญาณยืนยัน — ยังไม่เข้าโซนซื้อ";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-semibold text-white/90">AI Trade Signal</h2>
          <span className={`font-bold ${sig.action === 'Buy' ? 'text-green-400' : sig.action === 'Sell' ? 'text-red-400' : 'text-yellow-300'}`}>
            {sig.action === 'Buy' ? 'ซื้อ (Buy)' : sig.action === 'Sell' ? 'ขาย (Sell)' : 'ถือ (Hold)'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Info label="🎯 Target Price" value={`$${fmt(price * 1.08, 2)}`} />
          <Info label="🤖 Confidence" value={`${fmt(sig.confidence * 100, 0)}%`} />
          <Info label="📋 Reason" value={sig.reason} className="col-span-2" />
        </div>
        <div className="mt-5 bg-[#0f172a] rounded-2xl border border-white/10 p-4">
          <h3 className="text-lg font-semibold text-emerald-400 mb-2">🎯 AI Entry Zone</h3>
          <div className="text-sm font-semibold text-gray-300">{entryText}</div>
          <div className="mt-3 h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <div className="h-2 rounded-full transition-all" style={{
              width: `${Math.min(Math.max(rsi, 0), 100)}%`,
              background: rsi < 40 ? '#3b82f6' : rsi <= 60 ? '#22c55e' : rsi <= 70 ? '#eab308' : '#ef4444'
            }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>30</span><span>50</span><span>70</span></div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner">
        <h2 className="text-[18px] font-semibold text-white/90 mb-3">Technical Overview</h2>
        {!ind ? <div className="text-sm text-gray-400">Loading...</div> :
          <div className="grid grid-cols-2 gap-4">
            <Info label="Last Close" value={`$${fmt(ind.lastClose)}`} />
            <Info label="RSI (14)" value={fmt(ind.rsi, 1)} />
            <Info label="EMA 20" value={fmt(ind.ema20)} />
            <Info label="EMA 50" value={fmt(ind.ema50)} />
            <Info label="MACD Line" value={fmt(ind.macd?.line)} />
            <Info label="ATR (14)" value={fmt(ind.atr14, 3)} />
          </div>}
      </section>
    </div>
  );
}

/* ✅ Market News */
function MarketNews({ news }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner">
      <div className="flex justify-between mb-3">
        <h2 className="text-[18px] font-semibold text-white/90">Market News</h2>
      </div>
      {!news?.length && <div className="text-sm text-gray-400">No recent news.</div>}
      <ul className="mt-3 space-y-2">
        {news?.slice(0, 10).map((n, i) => (
          <li key={i} className="rounded-xl p-3 bg-black/25 border border-white/10 hover:border-emerald-400/30 transition">
            <a href={n.url || n.link} target="_blank" rel="noreferrer" className="block text-[15px] hover:text-emerald-400">{n.title}</a>
            <div className="text-xs text-gray-400 mt-1">{n.source} • {n.date}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ✅ AI ShortList */
function AIShortList() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const load = async () => {
      const r = await fetch('/api/screener-hybrid');
      const j = await r.json();
      const top = (j.results || []).filter(x => x.signal === 'Buy').slice(0, 5);
      setList(top);
    };
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 mt-10">
      <h2 className="text-lg font-semibold text-emerald-400 mb-3">🔥 AI Stocks To Watch</h2>
      <ul className="space-y-2">
        {list.map((s, i) => (
          <li key={i} className="flex justify-between items-center border border-white/10 rounded-xl px-3 py-2 bg-[#141b2d]">
            <Link href={`/analyze/${s.symbol}`} className="text-white font-bold">{s.symbol}</Link>
            <span className="text-gray-400 text-sm">{(s.confidence * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ✅ Galaxy Map */
function AIGalaxyMap() {
  return (
    <section className="mt-10 bg-[#141b2d] p-6 rounded-2xl border border-white/10">
      <h2 className="text-lg font-semibold text-emerald-400 mb-4 text-center">🌌 AI Galaxy Trend Map</h2>
      <div className="grid grid-cols-10 gap-[3px]">
        {Array.from({ length: 100 }).map((_, i) => {
          const c = i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#facc15' : '#ef4444';
          return <div key={i} className="w-5 h-5 rounded-sm" style={{ background: c, opacity: 0.85 }} />;
        })}
      </div>
      <div className="flex justify-center gap-5 mt-3 text-xs text-gray-400">
        <div>🟢 Uptrend</div><div>🟡 Sideway</div><div>🔴 Downtrend</div>
      </div>
    </section>
  );
          }
