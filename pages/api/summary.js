// pages/api/summary.js
export default async function handler(req, res) {
  try {
    const { url, lang = "th" } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const response = await fetch(url);
    const html = await response.text();

    // 🔹 ล้าง script/style/meta/comment
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<meta[^>]*>/gi, "")
      .replace(/<!--.*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 🔹 ดึงเฉพาะเนื้อหาที่ดูเหมือนข่าวจริง
    const sentences = text
      .split(/[.!?]\s+/)
      .filter(
        (s) =>
          s.length > 40 &&
          !s.match(/cookie|advert|subscribe|privacy|banner/i)
      )
      .slice(0, 3)
      .join(". ");

    // 🔹 แปลไทย (แบบพื้นฐาน)
    const translate = (t) =>
      t
        .replace(/Apple/gi, "แอปเปิล")
        .replace(/Microsoft/gi, "ไมโครซอฟท์")
        .replace(/Tesla/gi, "เทสลา")
        .replace(/Nvidia/gi, "เอ็นวิเดีย")
        .replace(/stock/gi, "หุ้น")
        .replace(/market/gi, "ตลาด")
        .replace(/growth/gi, "การเติบโต")
        .replace(/profit/gi, "กำไร")
        .replace(/company/gi, "บริษัท")
        .replace(/AI/gi, "เอไอ")
        .replace(/technology/gi, "เทคโนโลยี");

    const summary =
      lang === "th"
        ? translate(sentences)
        : sentences || "No summary available.";

    res.status(200).json({ summary });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({
      error: "Failed to summarize article",
    });
  }
}
