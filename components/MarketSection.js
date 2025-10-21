// ===== โหลดข้อมูลหุ้นต้นน้ำ =====
async function loadDiscovery(retry = 0) {
  try {
    setLoadingDiscovery(true);
    addLog("🌋 AI Discovery Pro v2 กำลังค้นหาหุ้นต้นน้ำ...");

    // ✅ 1. เชื่อมต่อ API ตัวใหม่ (v2)
    const res = await fetch("/api/visionary-discovery-pro-v2", { cache: "no-store" });
    if (!res.ok) throw new Error(`API error (${res.status})`);

    // ✅ 2. แปลงผลลัพธ์อย่างปลอดภัย
    const j = await res.json();
    if (!j || typeof j !== "object") throw new Error("Response ไม่ถูกต้องจาก AI Discovery API");

    const list = Array.isArray(j.top)
      ? j.top
      : Array.isArray(j.discovered)
      ? j.discovered
      : [];

    if (!list.length) throw new Error("ไม่พบข้อมูลหุ้นจาก AI Discovery Pro");

    // ✅ 3. แปลงข้อมูลให้ปลอดภัยทุกค่า
    const formatted = list
      .filter((r) => r && r.symbol) // กัน null / undefined
      .map((r) => ({
        symbol: String(r.symbol || "").toUpperCase(),
        lastClose: Number(r.price ?? r.lastClose ?? 0),
        rsi: Math.round(Number(r.rsi ?? 0)),
        reason:
          r.reason ||
          "AI พบแนวโน้มต้นน้ำชัดเจน + ข่าวเชิงบวก + ปัจจัยพื้นฐานดี",
        aiScore: Math.round(Number(r.aiScore ?? 0)),
        trend:
          r.trend ||
          (r.signal === "Buy"
            ? "Uptrend"
            : r.signal === "Sell"
            ? "Downtrend"
            : "Sideway"),
        signal: r.signal || "Hold",
      }));

    // ✅ 4. อัปเดต state
    setFutureDiscovery(formatted);
    addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);

    // ✅ 5. ดึงราคาจริงเฉพาะ 30 ตัวแรก
    for (const s of formatted.slice(0, 30)) {
      try {
        await fetchPrice(s.symbol);
      } catch (err) {
        addLog(`⚠️ ราคา ${s.symbol} ดึงไม่สำเร็จ: ${err.message}`);
      }
    }
  } catch (err) {
    // ✅ 6. ถ้า error จะ retry อัตโนมัติ 1 ครั้ง
    addLog(`⚠️ Discovery failed: ${err.message}`);
    if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
  } finally {
    // ✅ 7. ปิดสถานะโหลด
    setLoadingDiscovery(false);
  }
}
