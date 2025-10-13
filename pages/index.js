import { useEffect, useState } from "react";

export default function Home() {
  const [dataShort, setDataShort] = useState([]);
  const [dataMedium, setDataMedium] = useState([]);
  const [dataLong, setDataLong] = useState([]);
  const [symbolList, setSymbolList] = useState([]);
  const [favoritePrices, setFavoritePrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  // ✅ Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ✅ โหลดข้อมูล Screener
  async function loadAll() {
    setLoading(true);
    setError("");
    async function fetchData(horizon) {
      try {
        const res = await fetch("/api/screener", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizon }),
        });
        const j = await res.json();
        return j?.results || [];
      } catch (err) {
        console.error(err);
        return [];
      }
    }
    try {
      const [shortData, mediumData, longData] = await Promise.all([
        fetchData("short"),
        fetchData("medium"),
        fetchData("long"),
      ]);
      setDataShort(shortData);
      setDataMedium(mediumData);
      setDataLong(longData);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // ✅ โหลด Symbol จาก Yahoo ตามคำค้น และดึงราคาทันที
  async function loadSymbols(q = "") {
    try {
      if (!q.trim()) {
        setSymbolList([]);
        return;
      }
      const res = await fetch(`/api/symbols?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data.symbols)) {
        setSymbolList(data.symbols);
        data.symbols.forEach((s) => fetchYahooPrice(s.symbol));
      }
    } catch (err) {
      console.error("loadSymbols error:", err);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ✅ ค้นหา symbol จาก Yahoo ทุกครั้งที่พิมพ์
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.trim()) loadSymbols(search);
      else setSymbolList([]);
    }, 600);
    return () => clearTimeout(delay);
  }, [search]);

  // ✅ โหลด Favorites จาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // ✅ บันทึก Favorites ลง localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ⭐ จัดการ Favorites พร้อมดึงราคาจริงจาก Yahoo
  const toggleFavorite = async (symbol) => {
    setFavorites((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        fetchYahooPrice(symbol, true);
        return [...prev, symbol];
      }
    });
  };

  // ✅ ดึงราคาจริงจาก Yahoo API แล้วเก็บลง favoritePrices (เวอร์ชัน 3 ครอบคลุมสุด)
  async function fetchYahooPrice(symbol, forceUpdate = false) {
    try {
      let price = null;
      let changePercent = null;

      // 1️⃣ พยายามใช้ chart API ก่อน
      try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta) {
          price = meta.regularMarketPrice || meta.previousClose || null;
          changePercent = meta.regularMarketChangePercent || null;
        }
      } catch {
        console.warn(`chart API fail: ${symbol}`);
      }

      // 2️⃣ ถ้ายังไม่มีราคา ลอง fallback ไป quoteSummary
      if (!price) {
        try {
          const alt = await fetch(
            `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`
          );
          const altData = await alt.json();
          const p = altData?.quoteSummary?.result?.[0]?.price;
          price = p?.regularMarketPrice?.raw || p?.previousClose?.raw || null;
          changePercent = p?.regularMarketChangePercent?.raw || null;
        } catch {
          console.warn(`quoteSummary fail: ${symbol}`);
        }
      }

      // 3️⃣ ถ้ายังไม่มีอีก ลองใช้ quote?symbols= (แน่นอนสุด)
      if (!price) {
        try {
          const qres = await fetch(
            `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
          );
          const qdata = await qres.json();
          const q = qdata?.quoteResponse?.result?.[0];
          price = q?.regularMarketPrice || q?.previousClose || 0;
          changePercent = q?.regularMarketChangePercent || 0;
        } catch {
          console.warn(`quote?symbols fail: ${symbol}`);
        }
      }

      if (!price) {
        console.warn(`⚠️ ไม่พบราคา ${symbol}`);
        return;
      }

      setFavoritePrices((prev) => ({
        ...prev,
        [symbol]: { price, changePercent },
      }));

      if (forceUpdate) {
        setTimeout(() => setFavorites((prev) => [...prev]), 150);
      }
    } catch (err) {
      console.error("fetchYahooPrice error:", err);
    }
  }

  // ✅ โหลดราคาของ Favorites ทุกครั้งที่เปิดหน้า
  useEffect(() => {
    favorites.forEach((symbol) => fetchYahooPrice(symbol));
  }, [favorites]);

  // ✅ Auto Refresh ราคาทุก 60 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      if (favorites.length > 0) {
        favorites.forEach((s) => fetchYahooPrice(s));
      }
    }, 60000); // 60 วินาที
    return () => clearInterval(interval);
  }, [favorites]);

  // ✅ ล้างรายการโปรด
  const clearFavorites = () => {
    if (confirm("ต้องการล้างรายการโปรดทั้งหมดหรือไม่?")) {
      setFavorites([]);
      localStorage.removeItem("favorites");
      setFavoritePrices({});
    }
  };

  // ✅ รวมผลลัพธ์ทั้งหมด
  const filterDataAll = (dataShort, dataMedium, dataLong, search) => {
    if (!search.trim()) return { short: dataShort, medium: dataMedium, long: dataLong, extra: [] };

    const q = search.trim().toLowerCase();
    const match = (arr) => arr.filter((d) => (d.symbol || "").toLowerCase().includes(q));

    const extra = symbolList
      .filter((s) => (s.symbol || "").toLowerCase().includes(q))
      .slice(0, 10)
      .map((s) => ({
        symbol: s.symbol,
        name: s.name || "",
        lastClose: favoritePrices[s.symbol]?.price || null,
        rsi: null,
        signal: "-",
      }));

    return { short: match(dataShort), medium: match(dataMedium), long: match(dataLong), extra };
  };

  // ✅ ตารางหุ้น
  const renderTable = (title, color, data) => {
    if (!data.length) return null;
    return (
      <div className="my-8 rounded-2xl border border-white/10 bg-[#101827]/80 p-5 shadow-lg hover:shadow-[0_0_15px_rgba(0,255,180,0.2)] transition">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
          <h2 className={`text-lg sm:text-xl font-semibold ${color}`}>{title}</h2>
          {title.includes("Favorites") && (
            <button
              onClick={clearFavorites}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm border-collapse text-center">
            <thead className="bg-white/5 text-gray-400 uppercase text-[12px] tracking-wide">
              <tr>
                <th className="p-3 text-left pl-5">⭐</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Price</th>
                <th className="p-3">RSI</th>
                <th className="p-3">AI Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const isFav = favorites.includes(r.symbol);
                const priceObj = favoritePrices[r.symbol];
                return (
                  <tr
                    key={r.symbol}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td
                      onClick={() => toggleFavorite(r.symbol)}
                      className="cursor-pointer text-[16px] text-yellow-400 pl-5"
                    >
                      {isFav ? "★" : "☆"}
                    </td>
                    <td className="p-3 font-semibold text-sky-400 hover:text-emerald-400">
                      <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
                    </td>
                    <td
                      className={`p-3 font-mono font-semibold ${
                        priceObj?.changePercent > 0
                          ? "text-green-400"
                          : priceObj?.changePercent < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {priceObj?.price
                        ? `$${priceObj.price.toFixed(2)}`
                        : r.lastClose
                        ? `$${r.lastClose.toFixed(2)}`
                        : "-"}
                      {priceObj?.changePercent && (
                        <div className="text-xs">{priceObj.changePercent.toFixed(2)}%</div>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">{r.rsi ? r.rsi.toFixed(1) : "-"}</td>
                    <td className="p-3 text-gray-400">{r.signal || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const { short, medium, long, extra } = filterDataAll(
    dataShort,
    dataMedium,
    dataLong,
    search
  );
  const noResult =
    !short.length && !medium.length && !long.length && !extra.length && search.trim() !== "";

  const favoriteData = favorites
    .map((symbol) => {
      const found =
        dataShort.find((x) => x.symbol === symbol) ||
        dataMedium.find((x) => x.symbol === symbol) ||
        dataLong.find((x) => x.symbol === symbol) ||
        symbolList.find((x) => x.symbol === symbol);
      return found ? found : { symbol, name: "" };
    })
    .filter(Boolean);

  // ✅ UI หลัก
  return (
    <main className="min-h-screen bg-[#0b1220] text-white font-inter">
      <header className="sticky top-0 z-50 bg-[#0e1628]/80 backdrop-blur-md border-b border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between px-4 py-3 gap-3">
          <b className="text-[20px] sm:text-[22px] font-bold text-emerald-400">
            🌍 Visionary Stock Screener
          </b>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadAll();
                favorites.forEach((s) => fetchYahooPrice(s));
                if (search.trim()) loadSymbols(search);
              }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 rounded-lg text-emerald-300 font-semibold transition"
            >
              {loading ? "Loading..." : "🔁 Refresh"}
            </button>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#141b2d] border border-white/10 text-white text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search Symbol (เช่น NVDA, AAPL, AEHR, BBAI...)"
          className="w-full sm:w-1/2 px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 focus:border-emerald-400/40 outline-none transition text-gray-200 placeholder-gray-500 text-center"
        />
      </div>

      {/* Tables */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {error && <div className="text-center text-red-400 mb-4">{error}</div>}

        {noResult ? (
          <div className="text-center text-yellow-400 mt-8 text-sm">
            ⚠️ ไม่พบหุ้นที่ตรงกับคำค้น "<b>{search}</b>"
          </div>
        ) : (
          <>
            {favoriteData.length > 0 &&
              renderTable(
                "⭐ My Favorites — หุ้นที่คุณติดดาวไว้",
                "text-yellow-300",
                favoriteData
              )}
            {renderTable("⚡ Fast Movers — หุ้นขยับเร็วสุดในตลาด", "text-green-400", short)}
            {renderTable("🌱 Emerging Trends — หุ้นแนวโน้มเกิดใหม่", "text-yellow-400", medium)}
            {renderTable("🚀 Future Leaders — หุ้นต้นน้ำแห่งอนาคต", "text-sky-400", long)}
            {renderTable("🧠 Yahoo Trending Results", "text-emerald-400", extra)}
          </>
        )}
      </div>
    </main>
  );
          }
