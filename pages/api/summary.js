// /pages/api/summary.js
// ✅ Smart AI News Summarizer — รองรับภาษาไทย ไม่ใช้ OpenAI ไม่ต้องใช้คีย์ใด ๆ

export default async function handler(req, res) {
  try {
    const { url, lang = "th" } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // 🧩 ป้องกันเว็บข่าวบางเว็บบล็อก request (403)
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (AI Stock Screener)" },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Failed to fetch source: ${response.status}` });
    }

    const html = await response.text();

    // 🧹 ล้างโค้ดที่ไม่ใช่เนื้อข่าว (script, style, meta, comment, tag)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<meta[^>]*>/gi, "")
      .replace(/<!--.*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000); // ✂️ จำกัดความยาวเพื่อไม่ให้เกิน 5000 ตัวอักษร

    // 🔍 แยกเฉพาะประโยคที่ดูเหมือนเนื้อข่าวจริง
    const sentences = text
      .split(/[.!?]\s+/)
      .filter(
        (s) =>
          s.length > 40 && // ตัดประโยคสั้น ๆ ออก
          !s.match(/cookie|advert|subscribe|privacy|banner|accept/i)
      )
      .slice(0, 3) // เอาเฉพาะ 3 ประโยคแรก
      .join(". ");

    // 🪄 ฟังก์ชันแปลศัพท์สำคัญเป็นไทย (พื้นฐาน)
    const translate = (t) =>
      t
        .replace(/Apple/gi, "แอปเปิล")
        .replace(/Microsoft/gi, "ไมโครซอฟท์")
        .replace(/Tesla/gi, "เทสลา")
        .replace(/Nvidia/gi, "เอ็นวิเดีย")
        .replace(/Amazon/gi, "แอมะซอน")
        .replace(/Google/gi, "กูเกิล")
        .replace(/stock/gi, "หุ้น")
        .replace(/market/gi, "ตลาด")
        .replace(/growth/gi, "การเติบโต")
        .replace(/profit/gi, "กำไร")
        .replace(/company/gi, "บริษัท")
        .replace(/AI/gi, "เอไอ")
        .replace(/technology/gi, "เทคโนโลยี")
        .replace(/earnings/gi, "ผลประกอบการ")
        .replace(/investment/gi, "การลงทุน");

    // 🧠 แปลหรือคงภาษาเดิมตาม query
    let summary =
      lang === "th"
        ? translate(sentences)
        : sentences || "No summary available.";

    // 🩹 fallback หากข้อความว่าง
    if (!summary || summary.trim() === "") {
      summary = "No summary available for this page.";
    }

    // ✅ ส่งผลลัพธ์กลับ
    res.status(200).json({ summary });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({
      error: "Failed to summarize article",
      details: err.message,
    });
  }
      }
