import { createChart, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

export default function Chart({ candles = [], markers = [] }) {
  const chartRef = useRef();
  const [chart, setChart] = useState(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = createChart(chartRef.current, {
      height: 500,
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

  useEffect(() => {
    if (!chart) return;
    // ปรับขนาดอัตโนมัติเมื่อเปลี่ยนโหมดเต็มจอ
    chart.resize(
      window.innerWidth,
      isFull ? window.innerHeight : 500
    );
  }, [isFull, chart]);

  return (
    <div
      className={`relative w-full ${
        isFull
          ? 'fixed inset-0 z-[9999] bg-[#0b1220]'
          : 'h-[500px] rounded-2xl overflow-hidden border border-white/10'
      }`}
    >
      <div ref={chartRef} className="w-full h-full" />

      {/* ปุ่ม Fullscreen / Exit */}
      <button
        onClick={() => setIsFull(!isFull)}
        className={`absolute top-3 left-3 z-[10000] bg-white/10 hover:bg-white/20 text-xs px-3 py-1 rounded border border-white/20 ${
          isFull ? 'text-red-300' : ''
        }`}
      >
        {isFull ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}
