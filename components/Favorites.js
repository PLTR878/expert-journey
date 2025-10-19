import { useState, useRef, useEffect } from "react";

export default function Favorites({ favorites, setFavorites }) {
  const [data, setData] = useState([]);
  const [logos, setLogos] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // ✅ ดึงโลโก้จาก API อัจฉริยะ
  const fetchLogo = async (sym) => {
    try {
      const res = await fetch(`/api/visionary-eternal?type=logo&symbol=${sym}`);
      const json = await res.json();
      setLogos((prev) => ({ ...prev, [sym]: json.logo }));
    } catch {
      setLogos((prev) => ({
        ...prev,
        [sym]: "https://cdn-icons-png.flaticon.com/512/2301/2301122.png",
      }));
    }
  };

  // ✅ ดึงข้อมูลหุ้น (AI signal + RSI)
  const fetchData = async (sym) => {
    try {
      const res = await fetch(`/api/visionary-eternal?type=daily&symbol=${sym}`);
      const json = await res.json();

      if (json && !json.error) {
        let signal = "Hold";
        if (json.trend === "Uptrend") signal = "Buy";
        else if (json.trend === "Downtrend") signal = "Sell";

        setData((prev) => {
          const exist = prev.find((x) => x.symbol === sym);
          const item = { ...json, signal };
          return exist
            ? prev.map((x) => (x.symbol === sym ? { ...x, ...item } : x))
            : [...prev, item];
        });
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  // ✅ โหลดข้อมูลทุกตัว
  useEffect(() => {
    if (favorites?.length) {
      favorites.forEach((sym) => {
        fetchData(sym);
        fetchLogo(sym);
      });
    }
  }, [favorites]);

  const handleSubmit = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if (!favorites.includes(sym)) {
      const updated = [...favorites, sym];
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      await fetchData(sym);
      await fetchLogo(sym);
    }
    setSymbol("");
    setShowModal(false);
  };

  const removeFavorite = (sym) => {
    const updated = favorites.filter((s) => s !== sym);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
  const handleTouchEnd = (sym) => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (touchStartX.current - touchEndX.current > 70) removeFavorite(sym);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="w-full px-2 pt-3 bg-[#0b1220] text-gray-200 min-h-screen">
      <div className="flex justify-between items-center mb-3 px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          🔮 My Favorite Stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-300 hover:text-emerald-400 transition flex items-center gap-1 
                     border border-gray-700 rounded-md px-3 py-[4px] bg-[#0f172a]/70 hover:bg-[#162032]"
        >
          ➕ Search
        </button>
      </div>

      <div className="overflow-x-auto mt-1">
        <table className="w-full text-[15px] text-center border-separate border-spacing-0">
          <tbody>
            {favorites?.length ? (
              favorites.map((sym, i) => {
                const r = data.find((x) => x.symbol === sym);
                const logoSrc = logos[sym];

                return (
                  <tr
                    key={sym + i}
                    className="transition-all hover:bg-[#111827]/40 border-b border-gray-800/40"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleTouchEnd(sym)}
                  >
                    <td className="relative py-[13px] pl-[50px] text-left">
                      <div className="absolute left-[6px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full overflow-hidden bg-transparent">
                        <img
                          src={logoSrc}
                          alt={sym}
                          className="w-9 h-9 object-contain"
                        />
                      </div>
                      <a
                        href={`/analyze/${sym}`}
                        className="hover:text-emerald-400 transition-colors font-semibold tracking-tight text-white"
                      >
                        {sym}
                      </a>
                    </td>

                    <td className="py-[12px] px-3 text-right font-semibold text-gray-100 font-mono text-[15px]">
                      {r?.lastClose ? `$${r.lastClose.toFixed(2)}` : "-"}
                    </td>

                    <td
                      className={`py-[12px] px-3 text-right font-semibold font-mono text-[15px] ${
                        typeof r?.rsi === "number"
                          ? r.rsi > 70
                            ? "text-red-400"
                            : r.rsi < 40
                            ? "text-blue-400"
                            : "text-emerald-400"
                          : "text-gray-400"
                      }`}
                    >
                      {typeof r?.rsi === "number" ? Math.round(r.rsi) : "-"}
                    </td>

                    <td
                      className={`py-[12px] px-3 text-right font-semibold text-[15px] ${
                        r?.signal === "Buy"
                          ? "text-green-400"
                          : r?.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r?.signal || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-gray-500 text-center italic">
                  No favorites yet. Add one by searching ➕
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
            }
