import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

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

  // ✅ ดึงข้อมูลจาก API ใหม่ (daily.js)
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const [daily, n] = await Promise.all([
          fetch(`/api/daily?symbol=${symbol}`).then(r => r.json()),
          fetch(`/api/news?symbol=${symbol}`).then(r => r.json()),
        ]);
        setInd(daily);
        setNews(n.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  // ✅ กราฟแท่งเทียน (ใช้ historical data เดิม)
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
    if (sig.action === 'Buy')
      return [{ time: t, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: `BUY ${symbol}` }];
    if (sig.action === 'Sell')
      return [{ time: t, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: `SELL ${symbol}` }];
    return [{ time: t, position: 'inBar', color: '#facc15', shape: 'circle', text: `HOLD ${symbol}` }];
  }, [JSON.stringify(ind), hist?.length]);

  const sig = computeSignal(ind || {});
  const price = ind?.lastClose || hist?.at(-1)?.c || 0;

  const actionLabel =
    sig.action === 'Buy'
      ? 'ซื้อ (Buy)'
      : sig.action === 'Sell'
      ? 'ขาย (Sell)'
      : 'ถือ (Hold)';

  const colorAction =
    sig.action === 'Buy'
      ? 'text-green-400'
      : sig.action === 'Sell'
      ? 'text-red-400'
      : 'text-yellow-300';

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

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
        <div className="grid md:grid-cols-2 gap-6">

          {/* AI Signal */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[18px] font-semibold tracking-wide text-white/90">AI Trade Signal</h2>
              <span className={`text-base font-bold ${colorAction}`}>{actionLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Info label="🎯 Target Price" value={`$${fmt(ind?.targetPrice ?? price * 1.08, 2)}`} />
              <Info label="🤖 AI Confidence" value={`${fmt(ind?.confidencePercent ?? sig.confidence * 100, 0)}%`} />
              <Info label="📋 System Reason" value={ind?.trend || sig.reason} className="col-span-2" />
            </div>

            {/* ✅ Confidence Meter */}
            <div className="mt-4">
              <div className="text-xs text-gray-400 mb-1">
                Confidence Level ({fmt(ind?.confidencePercent ?? sig.confidence * 100, 0)}%)
              </div>
              <div className="w-full bg-[#111827] h-2 rounded-full overflow-hidden">
                <div
                  className="h-2 transition-all duration-500"
                  style={{
                    width: `${fmt(ind?.confidencePercent ?? sig.confidence * 100, 0)}%`,
                    background: ind?.confidenceColor || '#00ff95',
                  }}
                />
              </div>
            </div>

            {/* ✅ Entry Zone */}
            <section className="mt-5 bg-[#0f172a] rounded-2xl border border-white/10 p-4">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">🎯 AI Entry Zone</h3>
              <div className="text-sm font-semibold text-gray-300">
                {ind?.entryZone || 'Loading Entry Zone...'}
              </div>
            </section>
          </section>

          {/* Indicators */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-inner">
            <h2 className="text-[18px] font-semibold tracking-wide text-white/90 mb-3">Technical Overview</h2>
            {!ind ? (
              <div className="text-sm text-gray-400">Loading data...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Info label="Last Close" value={`$${fmt(ind.lastClose)}`} />
                <Info label="RSI (14)" value={fmt(ind.rsi, 1)} />
                <Info label="EMA 20" value={fmt(ind.ema20)} />
                <Info label="EMA 50" value={fmt(ind.ema50)} />
                <Info label="EMA 200" value={fmt(ind.ema200)} />
                <Info label="MACD Line" value={fmt(ind.macd?.line)} />
                <Info label="MACD Signal" value={fmt(ind.macd?.signal)} />
                <Info label="MACD Histogram" value={fmt(ind.macd?.hist)} />
                <Info label="ATR (14)" value={fmt(ind.atr14, 3)} />
                <Info label="Status" value={loading ? 'Updating…' : ind?.status || 'Realtime'} />
              </div>
            )}
          </section>
        </div>

        {/* ===== MARKET NEWS ===== */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold tracking-wide text-white/90">Market News</h2>
            <button
              onClick={() => location.reload()}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              🔄 Refresh
            </button>
          </div>
          {!news?.length && <div className="text-sm text-gray-400">No recent news.</div>}
          <ul className="mt-3 space-y-2">
            {news?.slice(0, 12).map((n, i) => (
              <li
                key={i}
                className="rounded-xl p-3 bg-black/25 border border-white/10 hover:border-emerald-400/30 hover:bg-white/5 transition-all duration-300"
              >
                <a href={n.url || n.link} target="_blank" rel="noreferrer" className="block font-medium text-[15px] leading-snug hover:text-emerald-400 transition">
                  {n.title || n.headline}
                </a>
                <div className="text-xs text-gray-400 mt-1 border-t border-white/5 pt-1">
                  {(n.source || n.publisher || '').toString()} • {(n.publishedAt || n.time || '').toString()}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

/* ✅ กล่อง Info — มืออาชีพ */
function Info({ label, value, className = '' }) {
  const color =
    value?.includes('%')
      ? value.includes('-')
        ? 'text-red-400'
        : 'text-emerald-400'
      : 'text-gray-100';

  return (
    <div
      className={`rounded-xl border border-white/10 bg-gradient-to-b from-[#141b2d] to-[#0b1220]
      p-4 flex flex-col items-center justify-center text-center
      shadow-[inset_0_2px_6px_rgba(255,255,255,0.03)] hover:border-emerald-400/30
      transition-all duration-300 ${className}`}
    >
      <div className="text-[11px] text-gray-400 tracking-wide mb-2">{label}</div>
      <div
        className={`text-[17px] sm:text-[18px] font-bold font-[monospace] tracking-wide leading-tight ${color}
        drop-shadow-[0_0_6px_rgba(16,185,129,0.25)] bg-gradient-to-b from-white/90 to-gray-300/40 bg-clip-text text-transparent
        transition-all duration-300 hover:scale-[1.05] hover:opacity-90`}
      >
        {value}
      </div>
    </div>
  );
}
