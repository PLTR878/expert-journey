// pages/api/symbols.js
export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ✅ รองรับ query ค้นหา (เช่น /api/symbols?q=AEHR)
  const { q } = req.query;
  const searchQuery = q?.trim() || "";

  // ถ้าไม่ได้พิมพ์ค้นหาเลย ให้ใช้ default = 'A'
  const queryToUse = searchQuery || "A";

  try {
    // ✅ ใช้ Yahoo Search API (ดึงหุ้นทุกตัวได้)
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      queryToUse
    )}&lang=en-US&region=US`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "visionary-screener/1.0 (+vercel)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(502).json({
        error: "Upstream error",
        status: response.status,
        body: text.slice(0, 300),
      });
    }

    const data = await response.json();

    // ✅ แปลงข้อมูลให้หน้าเว็บใช้ง่าย
    const symbols =
      data?.quotes
        ?.filter(
          (q) =>
            q.symbol &&
            ["NMS", "NYQ", "ASE", "NASDAQ", "NYSE"].includes(q.exchange)
        )
        .map((q) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || "",
        })) || [];

    // ✅ ป้องกันซ้ำ + เรียง A→Z
    const seen = new Set();
    const cleanSymbols = symbols.filter((x) => {
      if (seen.has(x.symbol)) return false;
      seen.add(x.symbol);
      return true;
    });

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=86400"
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(200).json({ symbols: cleanSymbols });
  } catch (err) {
    console.error("❌ Error fetching symbols:", err);
    return res.status(500).json({ error: "Failed to fetch symbols" });
  }
}
