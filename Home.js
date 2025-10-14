// ✅ ดึงราคาผ่าน API ของเราเอง (แก้ปัญหา CORS)
async function fetchYahooPrice(symbol, forceUpdate = false) {
  try {
    const r = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
    if (!r.ok) return;
    const j = await r.json();

    // ✅ ถ้าไม่มีข้อมูล (null) ก็ใส่ค่า 0 แทน
    setFavoritePrices((prev) => ({
      ...prev,
      [symbol]: { price: j.price ?? 0, changePercent: j.changePercent ?? 0.0 },
    }));

    // ✅ บังคับ refresh UI หลังโหลดราคา
    if (forceUpdate) setTimeout(() => setFavorites((prev) => [...prev]), 100);
  } catch (err) {
    console.error("fetchYahooPrice error:", err);
  }
}
