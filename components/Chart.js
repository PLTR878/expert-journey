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
        textColor: '#f3f4f6', // ✅ สีตัวหนังสือชัดมากขึ้น
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#334155',
        textColor: '#ffffff', // ✅ ตัวเลขราคาด้านขวาสีขาวชัดสุด
        scaleMargins: { top: 0.1, bottom: 0.05 },
        mode: 1, // normal scale mode
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chartInstance.addCandlestickSeries({
      upColor: '#00c48a',
      downColor: '#ef4444',
      borderUpColor: '#00c48a',
      borderDownColor: '#ef4444',
      wickUpColor: '#00c48a',
      wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    const data = candles.map((c) => ({
      time: c.t / 1000,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));

    candleSeries.setData(data);
    if (markers?.length) candleSeries.setMarkers(markers);
    chartInstance.timeScale().fitContent();

    // ✅ เส้นราคา + Label สีฟ้าอ่อนดูเด่น
    if (data.length > 0) {
      const last = data[data.length - 1];
      candleSeries.createPriceLine({
        price: last.close,
        color: '#60a5fa',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `Price ${last.close.toFixed(2)}`,
        titleFontSize: 12,
        axisLabelColor: '#1e3a8a', // ✅ พื้นหลัง Label สีฟ้าเข้ม
      });
    }

    setChart(chartInstance);
    return () => chartInstance.remove();
  }, [candles, markers]);

  // ✅ Fullscreen ปรับขนาด + หมุนจอ
  useEffect(() => {
    if (!chart) return;

    const resize = () => {
      chart.resize(window.innerWidth, isFull ? window.innerHeight : 500);
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
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />

      {/* ปุ่ม Fullscreen */}
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
