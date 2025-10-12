import { createChart, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

export default function Chart({ candles = [], markers = [] }) {
  const chartContainerRef = useRef();
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      height: 500,
      layout: { background: { color: '#0b1220' }, textColor: '#DDD' },
      grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#555' },
      timeScale: { borderColor: '#555', timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    const formatted = candles.map(c => ({
      time: c.t / 1000,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));

    candleSeries.setData(formatted);
    if (markers?.length) candleSeries.setMarkers(markers);
    chart.timeScale().fitContent();

    // ตรวจจับสถานะ fullscreen
    const handleChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);

    return () => {
      chart.remove();
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, [candles, markers]);

  const handleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  return (
    <div className={`relative w-full ${isFull ? 'h-screen fixed inset-0 z-50 bg-[#0b1220]' : 'h-[500px] rounded-2xl overflow-hidden border border-white/10'}`}>
      <div ref={chartContainerRef} className="w-full h-full pointer-events-auto" />

      {/* ปุ่ม Fullscreen / Exit */}
      <button
        onClick={handleFullscreen}
        className="absolute top-2 left-2 z-50 bg-white/10 hover:bg-white/20 text-xs px-2 py-1 rounded border border-white/20 pointer-events-auto"
      >
        {isFull ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}
