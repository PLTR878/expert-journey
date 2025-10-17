// ✅ /pages/api/news.js
export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol" });
  }

  try {
    // ✅ แหล่งข่าวหลัก (Yahoo Finance)
    const yahoo = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${symbol}`
    ).then((r) => r.json());

    // ✅ แหล่งข่าวสำรอง (Google News RSS)
    const googleRSS = await fetch(
      `https://news.google.com/rss/search?q=${symbol}+stock&hl=en-US&gl=US&ceid=US:en`
    ).then((r) => r.text());

    // ✅ แหล่งข่าวที่ 3 (Investing.com scraping via free proxy)
    const investing = await fetch(
      `https://r.jina.ai/https://www.investing.com/search/?q=${symbol}`
    ).then((r) => r.text());

    // 🧠 รวมข่าวจากทุกแหล่ง
    const items = [];

    // 🟢 ดึงจาก Yahoo (มีโครงสร้างชัดเจน)
    if (yahoo?.news && Array.isArray(yahoo.news)) {
      yahoo.news.slice(0, 10).forEach((n) =>
        items.push({
          title: n.title || n.summary || symbol,
          url: n.link || n.url,
          source: "Yahoo Finance",
          publishedAt: n.provider?.displayName || "",
        })
      );
    }

    // 🟡 ดึงจาก Google RSS (อ่านจาก XML text)
    const rssMatches = googleRSS.match(/<item>[\s\S]*?<\/item>/g) || [];
    rssMatches.slice(0, 10).forEach((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1];
      const link = item.match(/<link>(.*?)<\/link>/)?.[1];
      if (title && link)
        items.push({
          title,
          url: link,
          source: "Google News",
          publishedAt: "Recently",
        });
    });

    // 🔵 ดึงจาก Investing.com (ข้อความดิบ)
    const investMatches =
      investing.match(/<a [^>]*href="(\/news\/[^"]+)"[^>]*>(.*?)<\/a>/g) || [];
    investMatches.slice(0, 10).forEach((a) => {
      const link = a.match(/href="(.*?)"/)?.[1];
      const title = a.replace(/<[^>]+>/g, "").trim();
      if (link && title)
        items.push({
          title,
          url: "https://www.investing.com" + link,
          source: "Investing.com",
          publishedAt: "Recently",
        });
    });

    // ✨ กรองซ้ำ + จำกัด 10 ข่าวล่าสุด
    const unique = [];
    const final = [];
    for (const n of items) {
      if (!unique.includes(n.url)) {
        unique.push(n.url);
        final.push(n);
      }
    }

    if (final.length === 0) {
      return res.status(200).json({
        items: [],
        message: "No news found right now — all sources returned empty",
      });
    }

    res.status(200).json({ items: final.slice(0, 10) });
  } catch (err) {
    console.error("❌ NEWS API ERROR:", err);
    res.status(500).json({ error: "Failed to fetch news", details: err.message });
  }
      }
