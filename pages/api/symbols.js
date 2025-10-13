// pages/api/symbols.js
export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { q } = req.query;
  const query = q?.trim() || "AAPL";

  const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&lang=en-US&region=US`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://finance.yahoo.com/",
      },
    });

    let symbols = [];

    if (response.ok) {
      const data = await response.json();

      symbols =
        data?.quotes
          ?.filter((x) => x.symbol && !x.symbol.startsWith("^"))
          ?.map((x) => ({
            symbol: (x.symbol || "").toUpperCase().trim(),
            name: x.shortname || x.longname || "",
          })) || [];
    }

    // ✅ ถ้าไม่มีข้อมูลจาก search — ใช้ fallback "trending"
    if (!symbols.length) {
      const trendRes = await fetch(
        "https://query1.finance.yahoo.com/v1/finance/trending/US?count=100",
        {
          headers: {
            "User-Agent": "visionary-screener/1.0 (+vercel)",
            Accept: "application/json",
          },
        }
      );
      const trendData = await trendRes.json();
      const quotes =
        trendData?.finance?.result?.[0]?.quotes?.map((q) => ({
          symbol: (q.symbol || "").toUpperCase().trim(),
          name: q.shortName || q.longName || "",
        })) || [];
      symbols = quotes;
    }

    // ✅ กรองเฉพาะหุ้นจริง (ไม่เอา Option, ETF code แปลก ๆ)
    symbols = symbols.filter(
      (x) => x.symbol && /^[A-Z]{1,6}$/.test(x.symbol)
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=900, stale-while-revalidate=86400"
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(200).json({ symbols });
  } catch (err) {
    console.error("❌ Error fetching symbols:", err);
    return res.status(500).json({ error: "Failed to fetch symbols" });
  }
}
