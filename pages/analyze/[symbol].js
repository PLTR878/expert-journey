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

  if (score >= 4) return { action: 'Buy', confidence: score / 5, reason: 'แนวโน้มขาขึ้นชัดเจน (Bullish Momentum)' };
  if (score <= 1) return { action: 'Sell', confidence: (2 - score) / 2, reason: 'แรงขายกดดัน (Bearish Pressure)' };
  return { action: 'Hold', confidence: 0.5, reason: 'สัญญาณเป็นกลาง (Neutral / ผสม)' };
}

export default function Analyze() {
  const { query, push } = useRouter();
  const symbol = (query.symbol || '').toString().toUpperCase();
  const [hist, setHist] = useState([]);
  const [ind, setInd] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const [h, i, n] = await Promise.all([
          fetch(`/api/history?symbol=${symbol}&range=6mo&interval=1d`).then(r => r.json()),
          fetch(`/api/indicators?symbol=${symbol}`).then(r => r.json()),
          fetch(`/api/news?symbol=${symbol}`).then(r => r.json()),
        ]);
        setHist(h.rows || []);
        setInd(i || {});
        setNews(n.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
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
    return [{ time: t, position: 'inBar', color: '#64748b', shape: 'circle', text: `HOLD ${symbol}` }];
  }, [JSON.stringify(ind), hist?.length]);

  const sig = computeSignal(ind || {});
  const price = ind?.lastClose || hist?.at(-1)?.c || 0;

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ===== HEADER + CHART ===== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#121a2f] to-[#0b1220] overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.05),inset_0_-6px_15px_rgba(0,0,0,0.7)]"></div>

          {/* Header */}
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
              <h2 className="text-[18px] font-semibold tracking-wide text-white/90">สัญญาณจากระบบ AI</h2>
              <span
                className={
                  'text-base font-bold ' +
                  (sig.action === 'Buy'
                    ? 'text-green-400'
                    : sig.action === 'Sell'
                    ? 'text-red-400'
                    : 'text-yellow-300')
                }
              >
                {sig.action === 'Buy'
                  ? 'สัญญาณซื้อ'
                  : sig.action === 'Sell'
                  ? 'สัญญาณขาย'
                  : 'ถือครอง'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Info label="🎯 ราคาเป้าหมาย (คาดการณ์)" value={`$${fmt(price * 1.08, 2)}`} />
              <Info label="🤖 ความเชื่อมั่นของ AI" value={`${fmt(sig.confidence * 100, 0)}%`} />
              <Info
                label="📋 เหตุผลจากระบบ"
                value={sig.reason}
                className="col-span-2"
              />
            </div>
          </section>

          {/* Indicators */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-inner">
            <h2 className="text-[18px] font-semibold tracking-wide text-white/90 mb-3">ภาพรวมทางเทคนิค</h2>
            {!ind ? (
              <div className="text-sm text-gray-400">กำลังโหลดข้อมูล...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Info label="ราคาปิดล่าสุด" value={`$${fmt(ind.lastClose)}`} />
                <Info label="RSI (14 วัน)" value={fmt(ind.rsi, 1)} />
                <Info label="EMA (20/50/200)" value={`${fmt(ind.ema20)} / ${fmt(ind.ema50)} / ${fmt(ind.ema200)}`} />
                <Info
                  label="MACD (หลัก/สัญญาณ/ฮิสโตแกรม)"
                  value={`${fmt(ind.macd?.line)} / ${fmt(ind.macd?.signal)} / ${fmt(ind.macd?.hist)}`}
                />
                <Info label="ATR (14)" value={fmt(ind.atr, 3)} />
                <Info label="สถานะข้อมูล" value={loading ? 'กำลังอัปเดต...' : 'เรียลไทม์'} />
              </div>
            )}
          </section>
        </div>

        {/* ===== MARKET NEWS ===== */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold tracking-wide text-white/90">ข่าวสารตลาดล่าสุด</h2>
            <button
              onClick={() => location.reload()}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              🔄 อัปเดตข่าว
            </button>
          </div>
          {!news?.length && <div className="text-sm text-gray-400">ยังไม่มีข่าวใหม่ในขณะนี้</div>}
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

function Info({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl bg-black/15 border border-white/10 p-3 flex flex-col justify-center ${className}`}>
      <div className="text-[11px] text-gray-400 tracking-wide mb-1">{label}</div>
      <div className="text-[15px] font-semibold text-gray-100 leading-tight">{value}</div>
    </div>
  );
                }
