// 🌌 Visionary Eternal Dashboard — Frontend (V∞.3)
// UI เดียว ครอบคลุมทุกระบบ เชื่อมกับ API /api/visionary-eternal.js

import { useState, useEffect } from "react";

export default function Home() {
  const [tab, setTab] = useState("market");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);

  const API = "/api/visionary-eternal";

  // ========== ฟังก์ชันหลัก ==========
  async function fetchPrice() {
    if (!input) return;
    setLoading(true);
    setOutput("⏳ Loading price...");
    try {
      const res = await fetch(`${API}?mode=price&symbol=${input}`);
      const j = await res.json();
      setData(j);
      setOutput(
        `💹 ${j.symbol} — $${j.price?.toFixed(2)} | RSI ${j.rsi?.toFixed(
          1
        )} | ${j.signal} (${j.trend})`
      );
    } catch (e) {
      setOutput("❌ Error loading data");
    } finally {
      setLoading(false);
    }
  }

  async function runScan() {
    setLoading(true);
    setOutput("📡 Scanning market...");
    try {
      const res = await fetch(`${API}?mode=scan`);
      const j = await res.json();
      setData(j.picks);
      setOutput(`✅ Scan complete (${j.picks.length} top stocks)`);
    } catch {
      setOutput("❌ Scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAIBrain() {
    setLoading(true);
    setOutput("🧠 AI Brain analyzing...");
    try {
      const res = await fetch(`${API}?mode=ai-brain`);
      const j = await res.json();
      setData(j);
      setOutput(`🤖 ${j.summary} | Memory ${j.memoryCount} stocks`);
    } catch {
      setOutput("❌ AI Brain error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNews() {
    if (!input) return;
    setLoading(true);
    setOutput("📰 Fetching news...");
    try {
      const res = await fetch(`${API}?mode=news&symbol=${input}`);
      const j = await res.json();
      setData(j);
      setOutput(j.ai_view || "✅ News loaded");
    } catch {
      setOutput("❌ News fetch failed");
    } finally {
      setLoading(false);
    }
  }

  // ========== UI ==========
  return (
    <main className="min-h-screen bg-[#0b1220] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#0e1628]/90 backdrop-blur border-b border-white/10 p-4 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-emerald-400 text-lg sm:text-xl font-bold">
          🌍 Visionary Eternal AI — V∞.3
        </h1>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="🔍 Enter Symbol (e.g. NVDA)"
          className="bg-[#141b2d] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 w-full sm:w-64 mt-2 sm:mt-0"
        />
      </header>

      {/* Main Content */}
      <section className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-3">
        <div className="flex gap-2 justify-around text-sm border-b border-white/10 pb-2">
          {[
            ["market", "🌐 Market Scan"],
            ["ai", "🧠 AI Brain"],
            ["price", "💹 Price"],
            ["news", "📰 News"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1 rounded-lg ${
                tab === id ? "bg-emerald-600 text-white" : "bg-[#111a2c]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Output */}
        <div className="bg-[#111a2c] border border-white/10 rounded-xl p-3 text-sm">
          <p className="text-emerald-400 mb-2">System Output</p>
          <div className="text-gray-300 whitespace-pre-line">{output}</div>
        </div>

        {/* Data Display */}
        {tab === "market" && Array.isArray(data) && (
          <div className="bg-[#0f192e] border border-white/10 rounded-lg p-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="text-left">Symbol</th>
                  <th>Price</th>
                  <th>RSI</th>
                  <th>Signal</th>
                  <th>Trend</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="text-emerald-400">{x.symbol}</td>
                    <td>${x.price?.toFixed(2)}</td>
                    <td>{x.rsi?.toFixed(1)}</td>
                    <td>{x.signal}</td>
                    <td>{x.trend}</td>
                    <td>{x.score?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "ai" && data && data.best && (
          <div className="bg-[#0f192e] border border-white/10 rounded-lg p-3">
            <p className="text-emerald-400 mb-2">Top AI Picks:</p>
            <ul className="space-y-1 text-sm">
              {data.best.map((x, i) => (
                <li key={i}>
                  ✅ {x.symbol} — ${x.price?.toFixed(2)} | RSI {x.rsi?.toFixed(1)} |{" "}
                  {x.signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "news" && data && data.items && (
          <div className="bg-[#0f192e] border border-white/10 rounded-lg p-3">
            <p className="text-emerald-400 mb-2">Latest News:</p>
            <ul className="space-y-1 text-sm">
              {data.items.map((n, i) => (
                <li key={i}>
                  📰 <a href={n.link} className="text-blue-400" target="_blank">
                    {n.title}
                  </a>{" "}
                  — {n.source}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#0e1628]/90 border-t border-white/10 text-center text-xs text-gray-400 py-2">
        ⚙️ Visionary AI Stack — Self-Evolving System (∞)
      </footer>

      {/* Control Buttons */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-[#0e1628]/95 border-t border-white/10 py-2 text-xs text-gray-400">
        <button onClick={runScan} disabled={loading}>📡 Scan</button>
        <button onClick={fetchPrice} disabled={loading}>💹 Price</button>
        <button onClick={runAIBrain} disabled={loading}>🧠 AI Brain</button>
        <button onClick={fetchNews} disabled={loading}>📰 News</button>
      </nav>
    </main>
  );
}
