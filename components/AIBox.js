import { useState } from "react";

export default function AIBox() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");

    const res = await fetch("/api/ai-visionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const j = await res.json();
    setAnswer(j.result);
    setLoading(false);
  };

  return (
    <div className="bg-[#0b1220] p-4 rounded-2xl border border-gray-700 text-gray-100 max-w-xl mx-auto mt-6">
      <h2 className="text-emerald-400 font-bold text-lg mb-2 text-center">
        💬 Visionary AI (GPT-5)
      </h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="พิมพ์คำถาม เช่น วิเคราะห์ PLTR หรือ AEHR"
        rows={3}
        className="w-full p-2 bg-[#0f172a] border border-gray-700 rounded-md mb-3 text-sm focus:ring-1 focus:ring-emerald-400"
      />
      <button
        onClick={askAI}
        disabled={loading}
        className="w-full bg-emerald-500/80 hover:bg-emerald-500 text-white py-2 rounded-md text-sm font-bold"
      >
        {loading ? "⚙️ กำลังคิด..." : "⚡ ถาม AI"}
      </button>

      {answer && (
        <div className="mt-4 bg-[#111827] border border-gray-700 rounded-md p-3 text-sm whitespace-pre-line">
          {answer}
        </div>
      )}
    </div>
  );
          }
