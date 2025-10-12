import { createChart, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

export default function Chart({ candles = [], markers = [] }) {
  const chartRef = useRef();
  const [chart, setChart] = useState(null);
  const [isFull, setIsFull] = useState(false);

  // ✅ สร้างกราฟ
  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = createChart(chartRef.current, {
      layout: { background: { color: '#0b1220' }, textColor: '#DDD' },
      grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#555' },
      timeScale: { borderColor: '#555', timeVisible: true },
    });

    const candleSeries = chartInstance.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const data = candles.map(c => ({
      time: c.t / 1000,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));

    candleSeries.setData(data);
    if (markers?.length) candleSeries.setMarkers(markers);
    chartInstance.timeScale().fitContent();

    setChart(chartInstance);
    return () => chartInstance.remove();
  }, [candles, markers]);

  // ✅ จัดการ fullscreen + หมุนแนวนอน
  useEffect(() => {
    if (!chart) return;

    const resize = () => {
      chart.resize(window.innerWidth, window.innerHeight);
    };

    if (isFull) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      screen.orientation?.lock?.('landscape').catch(() => {});
      resize();
    } else {
      document.exitFullscreen?.().catch(() => {});
      screen.orientation?.unlock?.();
      chart.resize(window.innerWidth, 500);
    }

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isFull, chart]);

  return (
    <div
      className={`relative ${
        isFull
          ? 'fixed inset-0 z-[9999] bg-[#0b1220] w-screen h-screen'
          : 'w-full h-[500px] rounded-2xl overflow-hidden border border-white/10'
      }`}
    >
      {/* พื้นที่กราฟ */}
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />

      {/* ปุ่ม toggle fullscreen */}
      <button
        onClick={() => setIsFull(!isFull)}
        className={`absolute top-3 left-3 z-[10000] px-3 py-1 rounded text-xs font-medium border ${
          isFull
            ? 'bg-red-500/20 text-red-300 border-red-400/40 hover:bg-red-500/40'
            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
        }`}
      >
        {isFull ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
      }
