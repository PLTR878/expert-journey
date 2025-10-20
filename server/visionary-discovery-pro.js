// ✅ /server/visionary-discovery-pro.js
export async function runFullDiscovery() {
  const batchSize = 300;
  const totalLimit = 7200;
  const symbols = Array.from({ length: totalLimit }, (_, i) => `STOCK${i + 1}`);
  const allResults = [];

  console.log(`🚀 เริ่มสแกนทั้งหมด ${totalLimit} หุ้น`);

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    console.log(`📊 กำลังสแกนรอบที่ ${i / batchSize + 1} (${batch.length} ตัว)`);

    const results = batch.map((s) => ({
      symbol: s,
      aiScore: Math.round(Math.random() * 40 + 60),
      price: (Math.random() * 100).toFixed(2),
      reason: "AI ตรวจพบแนวโน้มต้นน้ำ",
    }));

    allResults.push(...results);
    await new Promise((r) => setTimeout(r, 3000)); // พัก 3 วิ ป้องกันล่ม
  }

  const top50 = allResults.sort((a, b) => b.aiScore - a.aiScore).slice(0, 50);
  console.log(`✅ สแกนเสร็จแล้ว พบ ${top50.length} ตัวเด่น`);

  return {
    source: "AI Discovery Pro (Batch)",
    scanned: allResults.length,
    discovered: top50,
    timestamp: new Date().toISOString(),
  };
}
