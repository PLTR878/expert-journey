export default async function handler(req, res) {
  try {
    const { url, lang = "th" } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // ✅ ใช้ AllOrigins Proxy แทน (ฟรี + ไม่ติด CORS)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch source: ${response.status}` });
    }

    const html = await response.text();

    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<meta[^>]*>/gi, "")
      .replace(/<!--.*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const summary = text.split(/[.!?]\s+/).slice(0, 3).join(". ");

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
