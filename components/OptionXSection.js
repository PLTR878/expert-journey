// ✅ /components/OptionXTerminal.js — AI Option Summary Dashboard (Full)
import { useState, useEffect } from "react";

export default function OptionXTerminal() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/visionary-batch?batch=1", { cache: "no-store" });
      const j = await res.json();
      // สมมุติว่า api คืน results ที่มี symbol, last, rsi, trend, signal, aiScore, confidence, ema20, ema50, ema200
      setData(j.results || []);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
    return (
      <div className="text-center text-gray-400 py-10 animate-pulse">
        🔍 กำลังสแกนข้อมูลจาก AI Option Scanner...
      </div>
    );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
        💹 AI Trade & Option Summary
      </h1>

      {data.length === 0 && (
        <div className="text-gray-400 text-center py-10">
          ยังไม่มีผลลัพธ์... กรุณากดสแกนใน OriginX ก่อน
        </div>
      )}

      {data.map((x, i) => (
        <div
          key={i}
          className="bg-[#101827] rounded-2xl p-4 border border-emerald-500/20 shadow-md shadow-black/40"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-emerald-300">{x.symbol}</h2>
            <span
              className={`text-sm font-bold ${
                x.signal === "Buy"
                  ? "text-emerald-400"
                  : x.signal === "Sell"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {x.signal}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
            <div>💵 ราคา: ${x.last}</div>
            <div>📊 RSI: {x.rsi}</div>
            <div>📈 แนวโน้ม: {x.trend}</div>
            <div>🤖 AI Score: {x.aiScore}</div>
            <div>🧠 ความมั่นใจ: {x.confidence}%</div>
          </div>

          {/* ===== EMA Table ===== */}
          <div className="bg-[#0f172a] rounded-xl border border-emerald-400/20 p-3 mb-3">
            <h3 className="text-emerald-400 font-semibold mb-2 text-sm">EMA Overview</h3>
            <div className="grid grid-cols-4 gap-2 text-sm text-center">
              <div className="bg-[#162033] rounded-lg p-2">
                <p className="text-gray-400 text-xs">Last</p>
                <p className="font-bold">${x.last}</p>
              </div>
              <div className="bg-[#162033] rounded-lg p-2">
                <p className="text-gray-400 text-xs">EMA20</p>
                <p className="font-bold">{x.ema20}</p>
              </div>
              <div className="bg-[#162033] rounded-lg p-2">
                <p className="text-gray-400 text-xs">EMA50</p>
                <p className="font-bold">{x.ema50}</p>
              </div>
              <div className="bg-[#162033] rounded-lg p-2">
                <p className="text-gray-400 text-xs">EMA200</p>
                <p className="font-bold">{x.ema200}</p>
              </div>
            </div>
          </div>

          {/* ===== Option Summary Block ===== */}
          <div className="bg-[#131c2d] rounded-xl border border-pink-500/20 p-3">
            <h3 className="text-pink-400 font-semibold mb-2 text-sm">Option Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-[#1b2435] rounded-lg p-2">
                <p className="text-gray-400 text-xs">🟢 Top Call</p>
                <p className="font-bold">Strike: $21.00</p>
                <p>Premium: $0.60</p>
                <p className="text-emerald-400">ROI: +85%</p>
              </div>
              <div className="bg-[#1b2435] rounded-lg p-2">
                <p className="text-gray-400 text-xs">🔴 Top Put</p>
                <p className="font-bold">Strike: $19.00</p>
                <p>Premium: $0.40</p>
                <p className="text-pink-400">ROI: +15%</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              <p>📘 Reason: AI expects upside momentum</p>
              <p>🎯 Entry Zone: Active Buy Zone</p>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 bg-[#0f172a] rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-emerald-400"
                style={{ width: `${x.confidence}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
            }
