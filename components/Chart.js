import { createChart, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export default function Chart({ candles = [], markers = [] }) {
  const ref = useRef();
  const chartRef = useRef(); // สำหรับ requestFullscreen

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
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
    if (markers.length) candleSeries.setMarkers(markers);

    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => chart.remove();
  }, [candles, markers]);

  const handleFullscreen = () => {
    if (ref.current?.requestFullscreen) {
      ref.current.requestFullscreen();
    } else if (ref.current?.webkitRequestFullscreen) {
      ref.current.webkitRequestFullscreen();
    } else if (ref.current?.msRequestFullscreen) {
      ref.current.msRequestFullscreen();
    }
  };

  return (
    <div ref={ref} className="relative w-full h-[500px] rounded-2xl overflow-hidden">
      {/* ปุ่ม Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-xs px-2 py-1 rounded border border-white/20"
      >
        Fullscreen
      </button>
    </div>
  );
}
