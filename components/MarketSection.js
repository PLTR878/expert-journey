async function loadDiscovery(retry = 0) {
  try {
    setLoadingDiscovery(true);
    addLog("🌋 AI Discovery Pro กำลังค้นหาหุ้นต้นน้ำ...");
    
    // ✅ เชื่อม API ตัวใหม่ (v2)
    const res = await fetch("/api/visionary-discovery-pro-v2", { cache: "no-store" });
    if (!res.ok) throw new Error(`API ${res.status}`);

    const j = await res.json();
    const list = j.top || j.discovered || [];

    if (!list.length) throw new Error("ไม่พบข้อมูลหุ้นจาก AI Discovery Pro");

    const formatted = list.map((r) => ({
      symbol: r.symbol,
      lastClose: parseFloat(r.price) || 0,
      rsi: r.rsi || 0,
      reason: r.reason || "AI พบแนวโน้มต้นน้ำชัดเจน + ข่าวเชิงบวก",
      aiScore: r.aiScore || 0,
      trend: r.signal || "Hold",
      signal: r.signal || "Hold",
    }));

    setFutureDiscovery(formatted);
    addLog(`✅ พบหุ้นต้นน้ำ ${formatted.length} ตัวจาก AI Discovery Pro`);

    // ดึงราคาจริงเฉพาะ 30 ตัวแรก
    for (const s of formatted.slice(0, 30)) await fetchPrice(s.symbol);
  } catch (err) {
    addLog(`⚠️ Discovery failed: ${err.message}`);
    if (retry < 1) setTimeout(() => loadDiscovery(retry + 1), 3000);
  } finally {
    setLoadingDiscovery(false);
  }
}
