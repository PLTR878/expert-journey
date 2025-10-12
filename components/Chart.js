import { createChart, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

export default function Chart({ candles = [], markers = [] }) {
  const chartRef = useRef();
  const [chart, setChart] = useState(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ ปรับขนาดให้เหมาะกับจออัตโนมัติ
    const chartInstance = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: isFull ? window.innerHeight : 380, // <-- ปรับความสูงให้พอดีกรอบ
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
        borderColor: '#334155',
        textColor: '#ffffff',
        scaleMargins: { top: 0.15, bottom: 0.1 }, // ✅ เว้นช่องบน-ล่าง ไม่ให้ชิดเกิน
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chartInstance.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
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

    // ✅ เส้นราคาปัจจุบัน (Last Price)
    if (data.length > 0) {
      const last = data[data.length - 1];
      candleSeries.createPriceLine({
        price: last.close,
        color: '#60a5fa',
        lineWidth: 2,
        axisLabelVisible: true,
        title: `Last: $${last.close.toFixed(2)}`,
      });
    }

    // ✅ ปรับขนาดอักษร Scale ให้ชัด
    candleSeries.priceScale().applyOptions({
      textColor: '#ffffff',
      fontSize: 13,
    });

    setChart(chartInstance);

    // ✅ ปรับขนาดเมื่อเปลี่ยนขนาดจอ
    const handleResize = () => {
      chartInstance.resize(chartRef.current.clientWidth, isFull ? window.innerHeight : 380);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      chartInstance.remove();
      window.removeEventListener('resize', handleResize);
    };
  }, [candles, markers, isFull]);

  // ✅ Fullscreen mode
  const toggleFullscreen = () => {
    setIsFull(!isFull);
    if (!isFull) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div
      className={`relative ${
        isFull
          ? 'fixed inset-0 z-[9999] bg-[#0b1220] w-screen h-screen'
          : 'w-full h-[380px] rounded-2xl overflow-hidden border border-white/10'
      }`}
    >
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />

      <button
        onClick={toggleFullscreen}
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
