// pages/api/summary.js
export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // ดึงเนื้อหาจากเว็บข่าว
    const response = await fetch(url);
    const html = await response.text();

    // ล้างแท็ก HTML ออก เหลือแต่ข้อความ
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // แยกเป็นประโยคแล้วดึงมา 3 ประโยคแรก
    const sentences = text.split(/[.!?]\s+/).slice(0, 3).join(". ") + ".";

    res.status(200).json({
      summary:
        sentences ||
        "No summary available — this site may block automatic text extraction.",
    });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ error: "Failed to summarize article" });
  }
}
