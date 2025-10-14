export default async function handler(req, res) {
  try {
    const { url, lang = "th" } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // ✅ ใช้ Proxy ฟรีเพื่อเลี่ยง CORS Block
    const proxyUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch source: ${response.status}` });
    }

    const text = await response.text();

    // ✅ ดึงเฉพาะเนื้อหาหลัก ๆ จากข่าว
    const cleanText = text
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 🔹 สรุปย่อ 3–4 ประโยคแรก
    const summary = cleanText.split(". ").slice(0, 3).join(". ");

    // 🔹 แปลไทยพื้นฐาน
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

    res.status(200).json({
      summary: lang === "th" ? translate(summary) : summary || "No summary available.",
    });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ error: "Failed to summarize article" });
  }
        }
