// /pages/analyze/[symbol].js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

// ---------- Utils ----------
const fmt = (n, d = 2) =>
  (Number.isFinite(n) ? Number(n).toFixed(d) : '-');

function computeSignal({ lastClose, ema20, ema50, rsi, macd }) {
  if (![lastClose, ema20, ema50, rsi, macd?.hist, macd?.line, macd?.signal]
    .every(v => Number.isFinite(v))) {
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

// ---------- TradingView Widget ----------
function TVChart({ symbol, theme = 'dark' }) {
  const id = useRef(`tv_${Math.random().toString(36).slice(2)}`);
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/tv.js';
    s.onload = () => {
      // eslint-disable-next-line no-undef
      new TradingView.widget({
        autosize: true,
        symbol,
        interval: '60',
        timezone: 'Etc/UTC',
        theme: theme === 'light' ? 'light' : 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: 'rgba(0,0,0,0)',
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: id.current,
        studies: ['EMA@tv-basicstudies', 'MACD@tv-basicstudies', 'RSI@tv-basicstudies'],
      });
    };
    document.body.appendChild(s);
    return () => {
      try { document.body.removeChild(s); } catch {}
    };
  }, [symbol, theme]);

  return <div id={id.current} className="h-[520px] w-full rounded-2xl overflow-hidden border border-white/10" />;
}

// ---------- Page ----------
export default function AnalyzePage() {
  const { query, push } = useRouter();
  const symbol = useMemo(() => String(query.symbol || '').toUpperCase(), [query.symbol]);

  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);
  const [ind, setInd] = useState(null);
  const [news, setNews] = useState([]);
  const [quote, setQuote] = useState(null);
  const signal = useMemo(() => ind ? computeSignal(ind) : { action: 'Hold', confidence: 0.5, reason: '-' }, [ind]);

  useEffect(() => {
    if (!symbol) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [iRes, nRes, qRes] = await Promise.all([
          fetch(`/api/indicators?symbol=${symbol}`),
          fetch(`/api/news?symbol=${symbol}`),
          fetch(`/api/quote?symbol=${symbol}`),
        ]);
        const [i, n, q] = await Promise.all([iRes.json(), nRes.json(), qRes.json()]);
        if (!alive) return;

        // normalize indicators payload
        setInd({
          lastClose: i?.lastClose ?? i?.close ?? null,
          ema20: i?.ema20 ?? i?.e20 ?? null,
          ema50: i?.ema50 ?? i?.e50 ?? null,
          ema200: i?.ema200 ?? i?.e200 ?? null,
          rsi: i?.rsi ?? null,
          macd: i?.macd ?? { line: null, signal: null, hist: null },
          atr: i?.atr ?? null,
        });
        setNews(Array.isArray(n?.items) ? n.items : (n || []));
        setQuote(q || null);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    // soft realtime quote polling
    const t = setInterval(async () => {
      try {
        const q = await fetch(`/api/quote?symbol=${symbol}`).then(r => r.json());
        setQuote(q || null);
      } catch {}
    }, 12000);

    return () => { alive = false; clearInterval(t); };
  }, [symbol]);

  const price = quote?.price ?? ind?.lastClose;

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c1426]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-3 py-3 flex items-center gap-3">
          <button
            onClick={() => push('/')}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold tracking-wide">
            {symbol || '—'} <span className="opacity-60">— Realtime Analysis</span>
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <div className="px-2 py-1 text-sm rounded bg-white/5 border border-white/10">
              {Number.isFinite(price) ? `$${fmt(price, 2)}` : '—'}
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-[#17233f] text-white text-sm px-2 py-1 rounded border border-white/10"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-3 py-4 space-y-4">
        {/* Chart */}
        <TVChart symbol={symbol} theme={theme} />

        {/* Top row: AI Card + Quick Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* AI Trade Signal */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">AI Trade Signal</h2>
              <span
                className={
                  'text-right text-base font-bold ' +
                  (signal.action === 'Buy'
                    ? 'text-green-400'
                    : signal.action === 'Sell'
                    ? 'text-red-400'
                    : 'text-yellow-300')
                }
              >
                {signal.action}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                <div className="opacity-70">Entry</div>
                <div className="text-lg font-semibold">-</div>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                <div className="opacity-70">Target</div>
                <div className="text-lg font-semibold">
                  {Number.isFinite(ind?.ema20) ? fmt(ind.ema20 * 1.11, 2) : '-'}
                </div>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                <div className="opacity-70">Stop</div>
                <div className="text-lg font-semibold">-</div>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                <div className="opacity-70">Confidence</div>
                <div className="text-lg font-semibold">{fmt(signal.confidence * 100, 0)}%</div>
              </div>
            </div>
            <div className="mt-3 text-sm opacity-80">
              <b>Reason:</b> {signal.reason}
            </div>
          </section>

          {/* Indicators */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold">Indicators</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Info label="Last Close" value={`$${fmt(ind?.lastClose)}`} />
              <Info label="RSI(14)" value={fmt(ind?.rsi, 1)} />
              <Info label="EMA20/50/200" value={
                `${fmt(ind?.ema20) } / ${ fmt(ind?.ema50) } / ${ fmt(ind?.ema200)}`
              } />
              <Info label="MACD (line/signal/hist)" value={
                `${fmt(ind?.macd?.line)} / ${fmt(ind?.macd?.signal)} / ${fmt(ind?.macd?.hist)}`
              } />
              <Info label="ATR(14)" value={fmt(ind?.atr, 3)} />
              <Info label="Data Status" value={loading ? 'Loading…' : 'Live'} />
            </div>
          </section>
        </div>

        {/* News */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Market News</h2>
            <button
              onClick={() => symbol && location.reload()}
              className="text-sm px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Refresh
            </button>
          </div>

          {!news?.length && (
            <div className="text-sm opacity-70 mt-3">No recent headlines.</div>
          )}

          <ul className="mt-3 space-y-2">
            {news?.slice(0, 12).map((n, i) => (
              <li key={i} className="rounded-xl p-3 bg-black/20 border border-white/10">
                <a
                  href={n.url || n.link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {n.title || n.headline}
                </a>
                <div className="text-xs opacity-60 mt-1">
                  {(n.source || n.publisher || '').toString()} • {(n.publishedAt || n.time || '').toString()}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="h-8" />
      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 p-3">
      <div className="opacity-70">{label}</div>
      <div className="text-base font-semibold break-all">{value}</div>
    </div>
  );
  }
