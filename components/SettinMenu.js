// ✅ /components/SettinMenu.js — Visionary GPT Style
import { useState } from "react";

export default function SettinMenu() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(`/api/ai-visionary?symbol=${encodeURIComponent(prompt)}`);
      const j = await res.json();

      if (j.success) {
        setAnswer(j.reply);
        setHistory((h) => [...h, { q: prompt, a: j.reply }]);
      } else {
        setAnswer("⚠️ ไม่สามารถดึงคำตอบจาก Visionary API ได้");
      }
    } catch (err) {
      console.error(err);
      setAnswer("❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#0b1220] text-gray-100 p-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-emerald-400 text-center mb-4">
          🤖 Visionary AI (GPT-Style)
        </h1>

        {/* ช่องพิมพ์คำถาม */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="พิมพ์คำถาม เช่น 'วิเคราะห์หุ้น PLTR แนวโน้ม 7 วัน'"
          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-sm mb-3 focus:ring-1 focus:ring-emerald-400"
        />

        {/* ปุ่มส่ง */}
        <button
          onClick={askAI}
          disabled={loading}
          className="w-full py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition"
        >
          {loading ? "⚙️ กำลังวิเคราะห์..." : "⚡ ถาม Visionary AI"}
        </button>

        {/* ส่วนแสดงผล */}
        <div className="mt-6 space-y-4">
          {history.map((item, i) => (
            <div key={i} className="bg-[#111827] p-3 rounded-lg border border-gray-700">
              <p className="text-emerald-400 font-semibold">🧠 {item.q}</p>
              <p className="text-gray-200 mt-1 whitespace-pre-line">{item.a}</p>
            </div>
          ))}

          {loading && (
            <div className="animate-pulse text-gray-400 text-sm mt-2">
              กำลังวิเคราะห์ข้อมูลด้วย Visionary GPT-5 ...
            </div>
          )}

          {answer && !loading && (
            <div className="bg-[#111827] border border-emerald-600 rounded-lg p-3 text-sm whitespace-pre-line mt-2">
              {answer}
            </div>
          )}
        </div>
      </div>
    </section>
  );
            }
