// ✅ /components/SettinMenu.js — แทนที่ด้วย Visionary AI UI
import { useState } from "react";

export default function SettinMenu() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("/api/ai-visionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const j = await res.json();
      setAnswer(j.result);
    } catch (err) {
      setAnswer("❌ ไม่สามารถเชื่อมต่อกับ AI ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#0b1220] text-gray-100 p-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-emerald-400 text-center mb-4">
          💬 Visionary AI (GPT-5)
        </h1>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="พิมพ์คำถาม เช่น 'วิเคราะห์ PLTR แนวโน้ม 7 วัน'"
          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-sm mb-3 focus:ring-1 focus:ring-emerald-400"
        />

        <button
          onClick={askAI}
          disabled={loading}
          className="w-full py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition"
        >
          {loading ? "⚙️ กำลังวิเคราะห์..." : "⚡ ถาม Visionary AI"}
        </button>

        {answer && (
          <div className="mt-4 bg-[#111827] border border-gray-700 rounded-lg p-3 text-sm whitespace-pre-line">
            {answer}
          </div>
        )}
      </div>
    </section>
  );
            }
