export default async function handler(req, res) {
  try {
    const { url, lang = "th" } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // ✅ ใช้ proxy ฟรี (AllOrigins) เพื่อเลี่ยง CORS Block
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok)
      return res.status(response.status).json({ error: `Failed to fetch source: ${response.status}` });

    const html = await response.text();

    // ✅ ดึงเฉพาะข้อความใน <p> (บทความจริง)
    const matches = html.match(/<p[^>]*>(.*?)<\/p>/gis);
    let text = matches
      ? matches
          .map((m) =>
            m
              .replace(/<[^>]+>/g, "")
              .replace(/\s+/g, " ")
              .trim()
          )
          .join(" ")
      : "";

    // 🔹 ล้างคำไม่จำเป็น
    text = text.replace(/(Cookies|subscribe|advert|policy|privacy)/gi, "").trim();

    // 🔹 สรุปย่อ 3–4 ประโยคแรก
    const sentences = text.split(/[.!?]\s+/).slice(0, 4).join(". ");

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

    const summary =
      lang === "th"
        ? translate(sentences)
        : sentences || "No summary available.";

    res.status(200).json({ summary });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ error: "Failed to summarize article" });
  }
}
