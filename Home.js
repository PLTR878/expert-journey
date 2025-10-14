// ✅ ดึงราคาผ่าน API ของเราเอง (แก้ปัญหา CORS)
async function fetchYahooPrice(symbol, forceUpdate = false) {
  try {
    const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
    if (!r.ok) return;
    const j = await r.json();

    setFavoritePrices((prev) => ({
      ...prev,
      [symbol]: { price: j.price, changePercent: j.changePercent ?? 0 },
    }));

    // บังคับ refresh UI หลังโหลดราคา
    if (forceUpdate) setTimeout(() => setFavorites((prev) => [...prev]), 100);
  } catch (err) {
    console.error("fetchYahooPrice error:", err);
  }
}
