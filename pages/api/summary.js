export default async function handler(req, res) {
  try {
    const { url, lang = "th" } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // ✅ Proxy 1: AllOrigins (หลัก)
    let proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    let response = await fetch(proxyUrl);

    // 🔁 ถ้า Proxy 1 ล่ม → ลอง Proxy 2: Jina AI
    if (!response.ok) {
      console.warn(`Proxy 1 failed (${response.status}), using backup proxy...`);
      proxyUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
      response = await fetch(proxyUrl);
    }

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Failed to fetch source: ${response.status}` });
    }

    const html = await response.text();

    // ✅ ดึงเฉพาะข้อความจาก <p>
    const matches = html.match(/<p[^>]*>(.*?)<\/p>/gis);
    let text = matches
      ? matches
          .map((m) => m.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
          .join(" ")
      : "";

    // 🔹 ถ้ายังไม่มีข้อความ ลองดึงจาก <article> หรือ <div>
    if (!text) {
      const articleMatch = html.match(/<article[^>]*>(.*?)<\/article>/gis);
      text = articleMatch
        ? articleMatch
            .map((m) => m.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
            .join(" ")
        : "";
    }

    // 🔹 ตัดคำไม่จำเป็น
    text = text.replace(/(Cookies|subscribe|advert|policy|privacy)/gi, "").trim();

    // 🔹 สรุปย่อ 3–5 ประโยค
    const summary = text.split(/[.!?]\s+/).slice(0, 5).join(". ");

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
