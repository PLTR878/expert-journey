import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('../../components/Chart'), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : '-');

function computeSignal({ lastClose, ema20, ema50, rsi, macd }) {
  if (![lastClose, ema20, ema50, rsi, macd?.hist, macd?.line, macd?.signal].every(v => Number.isFinite(v))) {
    return { action: 'Hold', confidence: 0.5, reason: 'Insufficient data' };
  }

  let score = 0;
  if (lastClose > ema20) score += 1;
  if (ema20 > ema50) score += 1;
  if (macd.hist > 0) score += 1;
  if (macd.line > macd.signal) score += 1;
  if (rsi > 50) score += 1;

  if (score >= 4) return { action: 'Buy', confidence: score / 5, reason: 'Strong bullish momentum' };
  if (score <= 1) return { action: 'Sell', confidence: (2 - score) / 2, reason: 'Bearish pressure' };
  return { action: 'Hold', confidence: 0.5, reason: 'Neutral / mixed signals' };
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
      <div className="max-w-6xl mx-auto px-3 py-4 space-y-4">
        {/* ✅ กราฟพร้อมหัวฝังในกรอบ */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {/* gradient ด้านบน */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0b1220]/90 to-transparent z-10 pointer-events-none"></div>

          {/* หัว AMD — ฝังในกราฟ */}
          <div className="absolute top-2 left-3 right-3 z-20 flex items-center justify-between text-sm sm:text-base font-semibold text-gray-200">
            <button
              onClick={() => push('/')}
              className="text-gray-400 hover:text-white transition font-medium"
            >
              ← Back
            </button>
            <div className="flex-1 text-center text-[15px] sm:text-[17px] tracking-wide">
              <span className="text-white">{symbol || '—'}</span>
              <span className="opacity-60 font-normal ml-1">— Realtime Analysis</span>
            </div>
            <div className="text-right font-semibold text-[14px] sm:text-[15px] text-green-400 drop-shadow">
              ${fmt(price, 2)}
            </div>
          </div>

          {/* กราฟ */}
          <div className="relative z-0">
            <Chart candles={hist} markers={markers} />
          </div>
        </div>

        {/* ✅ AI + Indicators */}
        <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">AI Trade Signal</h2>
              <span
                className={
                  'text-right text-base font-bold ' +
                  (sig.action === 'Buy'
                    ? 'text-green-400'
                    : sig.action === 'Sell'
                    ? 'text-red-400'
                    : 'text-yellow-300')
                }
              >
                {sig.action}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Info label="Target" value={fmt(price * 1.08, 2)} />
              <Info label="Confidence" value={`${fmt(sig.confidence * 100, 0)}%`} />
              <Info label="Reason" value={sig.reason} className="col-span-2" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold">Indicators</h2>
            {!ind ? (
              <div className="text-sm opacity-70 mt-2">Loading…</div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Info label="Last Close" value={`$${fmt(ind.lastClose)}`} />
                <Info label="RSI(14)" value={fmt(ind.rsi, 1)} />
                <Info label="EMA20/50/200" value={`${fmt(ind.ema20)} / ${fmt(ind.ema50)} / ${fmt(ind.ema200)}`} />
                <Info
                  label="MACD (L/S/H)"
                  value={`${fmt(ind.macd?.line)} / ${fmt(ind.macd?.signal)} / ${fmt(ind.macd?.hist)}`}
                />
                <Info label="ATR(14)" value={fmt(ind.atr, 3)} />
                <Info label="Status" value={loading ? 'Loading…' : 'Live'} />
              </div>
            )}
          </section>
        </div>

        {/* ✅ ข่าว */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Market News</h2>
            <button
              onClick={() => location.reload()}
              className="text-sm px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Refresh
            </button>
          </div>

          {!news?.length && <div className="text-sm opacity-70 mt-3">No recent headlines.</div>}

          <ul className="mt-3 space-y-2">
            {news?.slice(0, 12).map((n, i) => (
              <li key={i} className="rounded-xl p-3 bg-black/20 border border-white/10">
                <a href={n.url || n.link} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                  {n.title || n.headline}
                </a>
                <div className="text-xs opacity-60 mt-1">
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
    <div className={`rounded-xl bg-black/20 border border-white/10 p-3 ${className}`}>
      <div className="opacity-70 text-xs">{label}</div>
      <div className="text-base font-semibold break-all">{value}</div>
    </div>
  );
          }
