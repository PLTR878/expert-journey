// ✅ MarketSection — Styled identical to Favorites (no Search)
import React from "react";

export default function MarketSection({ title, rows, favorites, toggleFavorite, favoritePrices }) {
  return (
    <section className="w-full px-[6px] sm:px-3 pt-2 bg-[#0b1220] text-gray-200">
      {/* หัวข้อ */}
      <div className="flex justify-between items-center mb-3 px-[2px] sm:px-2">
        <h2 className="text-[17px] font-bold text-emerald-400 flex items-center gap-1">
          {title}
        </h2>
      </div>

      {/* รายการหุ้น */}
      <div className="flex flex-col divide-y divide-gray-800/50">
        {rows?.length ? (
          rows.map((r, i) => {
            const price = favoritePrices[r.symbol]?.price || r.lastClose;
            const rsi = favoritePrices[r.symbol]?.rsi || r.rsi;
            const signal = favoritePrices[r.symbol]?.signal || r.signal || "-";
            const isFav = favorites.includes(r.symbol);
            const domain = `${r.symbol?.toLowerCase()}.com`;

            return (
              <div
                key={r.symbol + i}
                className="flex items-center justify-between py-[12px] px-[4px] sm:px-3 hover:bg-[#111827]/40 transition-all"
              >
                {/* โลโก้ + ชื่อหุ้น */}
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://logo.clearbit.com/${domain}`}
                      alt={r.symbol}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://companieslogo.com/img/orig/${r.symbol.toUpperCase()}_BIG.png`;
                        setTimeout(() => {
                          if (e.target.naturalWidth === 0 || e.target.naturalHeight === 0) {
                            e.target.style.display = "none";
                            const parent = e.target.parentNode;
                            if (parent && !parent.querySelector(".fallback-logo")) {
                              const span = document.createElement("span");
                              span.className = "fallback-logo text-emerald-400 font-bold text-[13px]";
                              span.textContent = r.symbol[0];
                              parent.appendChild(span);
                            }
                          }
                        }, 800);
                      }}
                      className="w-9 h-9 object-contain transition-opacity duration-700 ease-in-out opacity-0"
                      onLoad={(e) => (e.target.style.opacity = 1)}
                    />
                  </div>

                  <div>
                    <a
                      href={`/analyze/${r.symbol}`}
                      className="text-white hover:text-emerald-400 font-semibold text-[15px]"
                    >
                      {r.symbol}
                    </a>
                    <div className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                      {r.companyName || r.name || ""}
                    </div>
                  </div>
                </div>

                {/* ขวา: ราคา / RSI / สัญญาณ */}
                <div className="flex items-center space-x-3 font-mono pr-[3px] sm:pr-4">
                  <span className="text-gray-100 text-[14px] font-semibold">
                    {price ? `$${Number(price).toFixed(2)}` : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-semibold ${
                      typeof rsi === "number"
                        ? rsi > 70
                          ? "text-red-400"
                          : rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {typeof rsi === "number" ? Math.round(rsi) : "-"}
                  </span>
                  <span
                    className={`text-[14px] font-bold ${
                      signal === "Buy"
                        ? "text-green-400"
                        : signal === "Sell"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {signal}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500 italic">
            No data available
          </div>
        )}
      </div>
    </section>
  );
                   }
