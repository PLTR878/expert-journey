import { useEffect, useState } from "react";

const DEFAULT_UNIVERSE = [];

export default function Home() {
  const [horizon, setHorizon] = useState("short");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [symbols, setSymbols] = useState(DEFAULT_UNIVERSE.join(","));
  const [quotes, setQuotes] = useState({});
  const [theme, setTheme] = useState("system");
  const [errorMsg, setErrorMsg] = useState("");

  // ---------- Theme ----------
  function applyTheme(next) {
    setTheme(next);
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else if (next === "light") root.classList.remove("dark");
    else {
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? root.classList.add("dark")
        : root.classList.remove("dark");
    }
  }

  // ---------- Run Screener ----------
  async function run() {
    setLoading(true);
    setErrorMsg("");
    try {
      const universe = symbols
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const r = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horizon,
          universe: universe.length ? universe : undefined,
        }),
      });

      const j = await r.json();
      console.log("📊 DEBUG screener result:", j);

      if (j && Array.isArray(j.results)) {
        setRows(j.results);
      } else {
        throw new Error("Invalid API response structure");
      }
    } catch (err) {
      console.error("❌ Screener error:", err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => applyTheme("system"), []);
  useEffect(() => run(), [horizon]);

  // ---------- Poll Quotes ----------
  useEffect(() => {
    let t;
    async function poll() {
      try {
        const syms = (rows.length ? rows.map((r) => r.symbol) : []).slice(0, 20);
        const m = {};
        await Promise.all(
          syms.map(async (s) => {
            const q = await fetch(`/api/quote?symbol=${s}`).then((r) =>
              r.json()
            );
            if (q?.price != null) m[s] = q;
          })
        );
        setQuotes(m);
      } catch (err) {
        console.error("⚠️ Poll error:", err);
      }
    }
    poll();
    t = setInterval(poll, 12000);
    return () => clearInterval(t);
  }, [rows.length]);

  // ---------- Safe render ----------
  function safeRenderRow(r) {
    try {
      const q = quotes[r.symbol] || {};
      const price = q.price ?? r.lastClose ?? "-";
      const change =
        q.changePct != null ? `${q.changePct.toFixed(2)}%` : "";
      const signal = r.signal || "-";
      const conf = Number.isFinite(r.conf)
        ? (r.conf * 100).toFixed(0)
        : "-";
      return (
        <tr
          key={r.symbol}
          className="border-b border-gray-700 hover:bg-[#1c2538]/70 transition"
        >
          <td className="p-2 font-semibold text-blue-400">
            <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
          </td>
          <td className="p-2 text-right">
            {Number.isFinite(r.score) ? r.score.toFixed(3) : "-"}
          </td>
          <td className="p-2 text-right">
            {price}{" "}
            <small
              className={
                (q.changePct || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {change}
            </small>
          </td>
          <td className="p-2 text-right">
            {Number.isFinite(r.rsi) ? r.rsi.toFixed(1) : "-"}
          </td>
          <td className="p-2 text-center">
            {[
              Number.isFinite(r.e20) ? r.e20.toFixed(2) : "-",
              Number.isFinite(r.e50) ? r.e50.toFixed(2) : "-",
              Number.isFinite(r.e200) ? r.e200.toFixed(2) : "-",
            ].join(" / ")}
          </td>
          <td className="p-2 text-center">
            <span
              className={
                signal === "Buy"
                  ? "text-green-400 font-bold"
                  : signal === "Sell"
                  ? "text-red-400 font-bold"
                  : "text-yellow-300 font-semibold"
              }
            >
              {signal}
            </span>
            <br />
            <small className="text-gray-400">{conf + "%"}</small>
          </td>
        </tr>
      );
    } catch (err) {
      console.error("❌ Render row error:", err);
      return (
        <tr key={Math.random()} className="text-red-400">
          <td colSpan="6" className="p-2 text-center">
            ⚠️ Error rendering row
          </td>
        </tr>
      );
    }
  }

  // ---------- UI ----------
  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 bg-[#101829]/90 backdrop-blur-md border-b border-gray-700 z-50">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 gap-2">
          <b className="text-xl font-semibold">📊 US AI Screener</b>
          <div className="flex flex-wrap gap-2">
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="px-2 py-1 rounded bg-[#1c2538] text-white"
            >
              <option value="short">2–7 วัน</option>
              <option value="medium">1–2 เดือน</option>
              <option value="long">10–20 ปี</option>
            </select>
            <button
              onClick={run}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded font-semibold"
            >
              {loading ? "กำลังสแกน..." : "สแกนใหม่"}
            </button>
          </div>
          <input
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
            placeholder="ใส่สัญลักษณ์ เช่น AAPL,NVDA"
            className="flex-1 min-w-[200px] bg-[#1c2538] text-white px-2 py-1 rounded"
          />
          <select
            value={theme}
            onChange={(e) => applyTheme(e.target.value)}
            className="px-2 py-1 rounded bg-[#1c2538] text-white"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>

      <div className="px-3 py-4 overflow-x-auto">
        {errorMsg && (
          <div className="text-red-400 text-center my-4">
            ⚠️ Error: {errorMsg}
          </div>
        )}

        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#162034] text-gray-300">
            <tr>
              <th className="p-2 text-left">สัญลักษณ์</th>
              <th className="p-2 text-right">คะแนน</th>
              <th className="p-2 text-right">ราคา</th>
              <th className="p-2 text-right">RSI</th>
              <th className="p-2 text-center">EMA20/50/200</th>
              <th className="p-2 text-center">AI Signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !errorMsg && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400">
                  🔍 ยังไม่มีรายการ — กรอกสัญลักษณ์ด้านบนแล้วกด “สแกนใหม่”
                  <br /> (ตัวอย่าง: AAPL, MSFT, NVDA)
                </td>
              </tr>
            )}
            {rows.map((r) => safeRenderRow(r))}
          </tbody>
        </table>
      </div>
    </main>
  );
                                 }
