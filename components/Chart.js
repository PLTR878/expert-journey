// ✅ Chart.js — lightweight mock chart for deployment (no errors)
import { useEffect, useRef } from "react";

export default function Chart({ candles = [], markers = [] }) {
  const ref = useRef();

  useEffect(() => {
    // แสดง mock chart บนหน้าจอ (หลอกกราฟไว้ก่อน)
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, ref.current.width, ref.current.height);
    ctx.fillStyle = "#22c55e";
    ctx.font = "14px sans-serif";
    ctx.fillText("📈 AI Visionary Chart Mock", 10, 25);
  }, [candles, markers]);

  return (
    <div className="relative w-full h-[300px] bg-[#111827] border border-white/10 rounded-xl flex items-center justify-center">
      <canvas ref={ref} width={500} height={300}></canvas>
    </div>
  );
}
