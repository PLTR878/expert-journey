// ===== โหลดข้อมูลหุ้นต้นน้ำ (แก้เสถียรสุด) =====
async function loadDiscovery(retry = 0) {
  try {
    setLoadingDiscovery(true);
    addLog("🌋 AI Discovery Pro v2 กำลังค้นหาหุ้นต้นน้ำ...");

    const res = await fetch("/api/visionary-discovery-pro-v2", { cache: "no-store" });
    if (!res.ok) throw new Error(`API ${res.status}`);

    const j = await res.json();

    // ✅ รองรับทั้ง discovered และ top (กัน undefined)
    const list = Array.isArray(j.discovered)
      ? j.discovered
      : Array.isArray(j.top)
      ? j.top
      : [];

    if (!list.length) {
      addLog("⚠️ ไม่พบข้อมูลหุ้นจาก AI Discovery (empty list)");
      setFutureDiscovery([]);
      return;
    }

    // ✅ สร้างข้อมูลสำหรับแสดงผล
    const formatted = list
      .filter((r) => r && r.symbol)
      .map((r) => ({
        symbol: String(r.symbol || "").toUpperCase(),
        lastClose: Number(r.price ?? 0),
        rsi: Math.round(Number(r.rsi ?? 0)),
        reason:
          r.reason ||
          "AI พบแนวโน้มต้นน้ำชัดเจน + ข่าวเชิงบวก + ปัจจัยพื้นฐานดี",
        aiScore: Math.round(Number(r.aiScore ?? 0)),
        signal: r.signal || "Hold",
      }));

    setFutureDiscovery(formatted);
    addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);

    // ✅ ดึงราคาจริงเฉพาะ 30 ตัวแรก
    for (const s of formatted.slice(0, 30)) {
      try {
        await fetchPrice(s.symbol);
      } catch (err) {
        addLog(`⚠️ Fetch price error for ${s.symbol}: ${err.message}`);
      }
    }
  } catch (err) {
    addLog(`❌ Discovery error: ${err.message}`);
    if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
  } finally {
    setLoadingDiscovery(false);
  }
}
