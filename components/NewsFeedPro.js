// components/NewsFeedPro.js
import { useEffect, useMemo, useState } from "react";

const SentimentPill = ({ s }) => {
  const map = {
    Positive: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30",
    Negative: "text-red-300 bg-red-500/10 border-red-400/30",
    Neutral:  "text-yellow-300 bg-yellow-500/10 border-yellow-400/30",
  };
  return (
    <span className={`px-2 py-[2px] rounded border text-[11px] font-semibold ${map[s] || map.Neutral}`}>
      {s || "Neutral"}
    </span>
  );
};

const SourceChip = ({ name }) => (
  <span className="px-2 py-[2px] rounded bg-white/5 border border-white/10 text-[11px] text-gray-300">{name}</span>
);

const timeAgo = (iso) => {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime())/1000));
  const map = [[31536000,"y"],[2592000,"mo"],[604800,"w"],[86400,"d"],[3600,"h"],[60,"m"],[1,"s"]];
  for (const [sec, unit] of map) if (diff >= sec) return `${Math.floor(diff/sec)}${unit}`;
  return "now";
};

const Skeleton = () => (
  <div className="animate-pulse border border-white/10 bg-[#0e1628]/60 rounded-2xl p-4 mb-3">
    <div className="h-3 w-24 bg-white/10 rounded mb-3" />
    <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
    <div className="h-4 w-2/3 bg-white/10 rounded mb-3" />
    <div className="h-3 w-20 bg-white/10 rounded" />
  </div>
);

export default function NewsFeedPro() {
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(12);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sym, setSym] = useState("");
  const [sent, setSent] = useState("All");
  const [view, setView] = useState("cozy"); // compact | cozy
  const [read, setRead] = useState(() => new Set(JSON.parse(localStorage.getItem("readNews")||"[]")));
  const [saved, setSaved] = useState(() => new Set(JSON.parse(localStorage.getItem("savedNews")||"[]")));

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const url = `/api/news?limit=150`;
        const j = await fetch(url).then(r=>r.json());
        setItems(Array.isArray(j.results) ? j.results : []);
      } catch (e) {
        setErr("โหลดข่าวไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    let arr = items;
    if (q.trim()) arr = arr.filter(x => x.title.toLowerCase().includes(q.trim().toLowerCase()));
    if (sym.trim()) arr = arr.filter(x => (x.symbols||[]).includes(sym.trim().toUpperCase()));
    if (sent !== "All") arr = arr.filter(x => x.sentiment === sent);
    return arr;
  }, [items, q, sym, sent]);

  const toShow = filtered.slice(0, visible);

  const toggleSave = (key) => {
    const ns = new Set(saved);
    ns.has(key) ? ns.delete(key) : ns.add(key);
    setSaved(ns);
    localStorage.setItem("savedNews", JSON.stringify([...ns]));
  };

  const markRead = (key) => {
    const nr = new Set(read); nr.add(key);
    setRead(nr);
    localStorage.setItem("readNews", JSON.stringify([...nr]));
  };

  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); } catch {}
  };

  return (
    <section className="bg-[#101827]/70 rounded-2xl p-4 border border-purple-400/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h2 className="text-purple-400 text-xl font-semibold">🧠 AI Market News — Early Signals</h2>
        <div className="flex gap-2">
          <select className="bg-[#141b2d] px-2 py-1 rounded text-sm" value={sent} onChange={e=>setSent(e.target.value)}>
            <option>All</option><option>Positive</option><option>Neutral</option><option>Negative</option>
          </select>
          <input className="bg-[#141b2d] px-2 py-1 rounded text-sm w-24" placeholder="Ticker (e.g. NVDA)" value={sym} onChange={e=>setSym(e.target.value.toUpperCase())}/>
          <input className="bg-[#141b2d] px-2 py-1 rounded text-sm w-40" placeholder="Search headline" value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="bg-[#141b2d] px-2 py-1 rounded text-sm" value={view} onChange={e=>setView(e.target.value)}>
            <option value="cozy">Cozy</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </div>

      {loading && (
        <>
          <Skeleton/><Skeleton/><Skeleton/><Skeleton/>
        </>
      )}

      {!loading && err && (
        <div className="border border-red-400/40 bg-red-500/10 text-red-200 rounded-xl p-4 text-sm">
          ⚠️ {err} — <button className="underline" onClick={()=>location.reload()}>ลองใหม่</button>
        </div>
      )}

      {!loading && !err && toShow.length === 0 && (
        <div className="text-center text-gray-400 py-10">No news data available.</div>
      )}

      {!loading && !err && toShow.map((n,i) => {
        const key = `${n.source}|${n.title}`;
        const isRead = read.has(key);
        const isSaved = saved.has(key);
        return (
          <article key={key} className={`border border-white/10 bg-[#0e1628]/80 rounded-2xl p-4 mb-3 ${isRead ? "opacity-70" : ""}`}>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
              <SourceChip name={n.source} />
              <span>•</span>
              <span>{timeAgo(n.date)} ago</span>
              {n.symbols?.length ? (
                <>
                  <span>•</span>
                  <div className="flex gap-1 flex-wrap">{n.symbols.map(s=>(
                    <span key={s} className="px-2 py-[1px] rounded bg-sky-500/10 text-sky-300 border border-sky-400/30 text-[10px]">{s}</span>
                  ))}</div>
                </>
              ):null}
              <span className="ml-auto"><SentimentPill s={n.sentiment} /></span>
            </div>

            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={()=>markRead(key)}
              className={`block ${view==="compact" ? "text-[14px]" : "text-[16px]"} font-medium text-emerald-300 hover:text-emerald-200`}
            >
              {n.title}
            </a>

            <div className="mt-3 flex gap-2">
              <button
                onClick={()=>toggleSave(key)}
                className={`px-2 py-1 rounded border text-xs ${isSaved ? "border-yellow-400/40 text-yellow-300 bg-yellow-500/10" : "border-white/10 text-gray-300 bg-white/5"}`}
              >
                {isSaved ? "★ Saved" : "☆ Save"}
              </button>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded border border-white/10 text-xs text-gray-300 bg-white/5">Open</a>
              <button onClick={()=>copy(n.url)} className="px-2 py-1 rounded border border-white/10 text-xs text-gray-300 bg-white/5">Copy Link</button>
              {isRead ? <span className="text-[11px] text-gray-400 self-center">Read</span> : null}
            </div>
          </article>
        );
      })}

      {!loading && filtered.length > visible && (
        <div className="text-center mt-4">
          <button
            onClick={()=>setVisible(v => v + 12)}
            className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-200 hover:bg-purple-500/30"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
  }
