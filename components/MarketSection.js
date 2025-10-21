// ===== โหลดข้อมูลหุ้นต้นน้ำ =====
async function loadDiscovery(retry = 0) {
  // ป้องกัน prerender พัง
  if (typeof window === "undefined") return;

  try {
    setLoadingDiscovery(true);
    addLog("🌋 AI Discovery Pro v2 กำลังค้นหาหุ้นต้นน้ำ...");

    // ✅ 1. เรียก API ตัวใหม่ (v2)
    const res = await fetch("/api/visionary-discovery-pro-v2", { cache: "no-store" });

    // ✅ ถ้า API error
    if (!res.ok) throw new Error(`API error (${res.status})`);

    // ✅ 2. ป้องกัน JSON พัง
    let j = null;
    try {
      j = await res.json();
    } catch (err) {
      throw new Error("ไม่สามารถอ่านข้อมูล JSON จาก API ได้");
    }

    // ✅ 3. ตรวจสอบผลลัพธ์
    if (!j || typeof j !== "object")
      throw new Error("Response จาก AI Discovery API ไม่ถูกต้อง");

    const list =
      Array.isArray(j.top) && j.top.length
        ? j.top
        : Array.isArray(j.discovered)
        ? j.discovered
        : [];

    if (!Array.isArray(list) || list.length === 0)
      throw new Error("ไม่พบข้อมูลหุ้นจาก AI Discovery Pro");

    // ✅ 4. แปลงข้อมูลให้ปลอดภัยทุกค่า
    const formatted = list
      .filter((r) => r && r.symbol)
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

    // ✅ 5. อัปเดต state
    setFutureDiscovery(formatted);
    addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);

    // ✅ 6. ดึงราคาจริงเฉพาะ 30 ตัวแรก (แบบปลอดภัย)
    for (const s of formatted.slice(0, 30)) {
      if (!s?.symbol) continue;
      try {
        await fetchPrice(s.symbol);
      } catch (err) {
        addLog(`⚠️ ดึงราคา ${s.symbol} ไม่สำเร็จ: ${err.message}`);
      }
      // ป้องกัน fetch ถี่เกินไปจนโดน block
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (err) {
    // ✅ 7. ถ้า error → retry 1 ครั้ง
    addLog(`⚠️ Discovery failed: ${err.message}`);
    if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
  } finally {
    // ✅ 8. ปิดสถานะโหลด
    setLoadingDiscovery(false);
  }
}
