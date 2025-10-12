import { createChart, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

export default function Chart({ candles = [], markers = [] }) {
  const chartRef = useRef();
  const [chart, setChart] = useState(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = createChart(chartRef.current, {
      layout: {
        background: { color: '#0b1220' },
        textColor: '#e5e7eb',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#374151',
        textColor: '#ffffff',          // ✅ ตัวเลขราคาด้านขวาเป็นสีขาวล้วน
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      localization: { locale: 'en-US', priceFormatter: p => `$${p.toFixed(2)}` },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chartInstance.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#ef4444',
      borderUpColor: '#16a34a',
      borderDownColor: '#ef4444',
      wickUpColor: '#16a34a',
      wickDownColor: '#ef4444',
      priceLineVisible: true,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
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

    // ✅ เส้นราคาปัจจุบัน + ป้ายราคาใหญ่สีฟ้าเข้ม
    if (data.length > 0) {
      const last = data[data.length - 1];
      candleSeries.createPriceLine({
        price: last.close,
        color: '#60a5fa',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `Last: $${last.close.toFixed(2)}`,
        axisLabelColor: '#1e3a8a',      // พื้นหลังป้าย
        titleFontSize: 14,
      });
    }

    // ✅ บังคับให้ตัวเลข scale ชัดขึ้นทุกขนาดจอ
    const priceScale = candleSeries.priceScale();
    priceScale.applyOptions({
      borderVisible: true,
      textColor: '#ffffff',
      fontSize: 14, // ขยายขนาดตัวเลขด้านขวา
    });

    setChart(chartInstance);
    return () => chartInstance.remove();
  }, [candles, markers]);

  // ---- Fullscreen Handler ----
  useEffect(() => {
    if (!chart) return;
    const resize = () => chart.resize(window.innerWidth, isFull ? window.innerHeight : 500);
    if (isFull) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      screen.orientation?.lock?.('landscape').catch(() => {});
      resize();
    } else {
      document.exitFullscreen?.().catch(() => {});
      screen.orientation?.unlock?.();
      resize();
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
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />

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
