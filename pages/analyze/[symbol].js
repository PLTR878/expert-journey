// /pages/analyze/[symbol].js
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
const Chart = dynamic(()=>import('../../components/Chart'), { ssr:false });
import AIBox from '../../components/AIBox';
import NewsFeed from '../../components/NewsFeed';

export default function Analyze(){
  const { query } = useRouter();
  const symbol = (query.symbol||'').toString().toUpperCase();
  const [hist, setHist] = useState([]);
  const [ind, setInd] = useState(null);
  const [signal, setSignal] = useState(null);
  const [news, setNews] = useState([]);

  useEffect(()=>{ if(!symbol) return; (async()=>{
    const [h,i,n,s] = await Promise.all([
      fetch(`/api/history?symbol=${symbol}&range=6mo&interval=1d`).then(r=>r.json()),
      fetch(`/api/indicators?symbol=${symbol}&range=6mo&interval=1d`).then(r=>r.json()),
      fetch(`/api/news?symbol=${symbol}`).then(r=>r.json()),
      fetch(`/api/ai-trade?symbol=${symbol}`).then(r=>r.json()),
    ]);
    setHist(h.rows||[]); setInd(i); setNews(n.items||[]); setSignal(s);
  })(); }, [symbol]);

  const markers = useMemo(()=>{
    if(!signal || !hist?.length) return [];
    const last = hist.at(-1)?.t;
    const t = Math.floor((last||Date.now())/1000);
    if (signal.action==='Buy') return [{ time: t, position:'belowBar', color:'#22c55e', shape:'arrowUp', text:`BUY ${symbol}` }];
    if (signal.action==='Sell') return [{ time: t, position:'aboveBar', color:'#ef4444', shape:'arrowDown', text:`SELL ${symbol}` }];
    return [{ time: t, position:'inBar', color:'#64748b', shape:'circle', text:`HOLD ${symbol}` }];
  }, [JSON.stringify(signal), hist?.length]);

  return (
    <main className="min-h-screen">
      <div className="container py-3">
        <div className="flex items-center gap-3">
          <a href="/" className="link">&larr; Back</a>
          <h1 className="m-0 text-xl font-bold">{symbol} — Realtime Analysis</h1>
        </div>

        <div className="mt-3 card p-3">
          <Chart candles={hist} markers={markers} />
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <AIBox signal={signal} />
            <div className="card p-4 mt-3">
              <h3 className="font-bold">Indicators</h3>
              {!ind? 'Loading…' : (
                <ul className="text-sm leading-7">
                  <li>Last Close: {ind.lastClose}</li>
                  <li>EMA20/50/200: {ind.ema20?.toFixed?.(2)} / {ind.ema50?.toFixed?.(2)} / {ind.ema200?.toFixed?.(2)}</li>
                  <li>RSI(14): {ind.rsi14?.toFixed?.(1)}</li>
                  <li>MACD: line={ind.macd?.line?.toFixed?.(3)} signal={ind.macd?.signal?.toFixed?.(3)} hist={ind.macd?.hist?.toFixed?.(3)}</li>
                  <li>ATR(14): {ind.atr14?.toFixed?.(3)}</li>
                </ul>
              )}
            </div>
          </div>
          <NewsFeed items={news} />
        </div>
      </div>
    </main>
  );
}
