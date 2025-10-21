// ✅ Visionary Auto Batch — รันทุก batch ทีละรอบจนจบ
export default async function handler(req, res) {
  const startBatch = Number(req.query.start || 1);
  const totalBatches = 25; // สำหรับ NASDAQ ~7000 / 300 = 23–25

  const allResults = [];

  for (let b = startBatch; b <= totalBatches; b++) {
    try {
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/visionary-batch?batch=${b}`;
      console.log(`⚙️ Running batch ${b} ...`);
      const r = await fetch(url);
      const j = await r.json();
      if (j?.results?.length) allResults.push(...j.results);
      if (!j.nextBatch) break;
      await new Promise((r) => setTimeout(r, 2000)); // พัก 2 วิ กัน timeout
    } catch (e) {
      console.error(`❌ Batch ${b} failed:`, e);
      continue;
    }
  }

  res.status(200).json({
    message: `✅ สแกนครบแล้วทั้งหมด ${allResults.length} ตัว`,
    timestamp: new Date().toISOString(),
    results: allResults.sort((a, b) => b.rsi - a.rsi).slice(0, 50),
  });
}
