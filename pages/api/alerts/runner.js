// /pages/api/alerts/runner.js
export const config = { runtime: "nodejs" };

const LAST_WINDOW_MS = 15 * 60 * 1000; // กันแจ้งซ้ำ 15 นาที

async function getJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchPrice(base, symbol) {
  const j = await getJSON(`${base}/api/price?symbol=${encodeURIComponent(symbol)}`);
  return {
    price: j?.price ?? null,
    rsi: typeof j?.rsi === "number" ? j.rsi : null,
    signal: j?.signal || null,
  };
}

async function fetchScreenerShort(base, symbol) {
  const j = await fetch(`${base}/api/screener`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ horizon: "short", universe: [symbol] }),
  }).then(r => r.json()).catch(() => ({}));
  const row = Array.isArray(j?.results) ? j.results.find(x => x.symbol === symbol) : null;
  return {
    rsi: row?.rsi ?? null,
    lastClose: row?.lastClose ?? null,
    signal: row?.signal ?? null,
  };
}

async function sendTelegram(msg) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chatId) return { ok: false, skipped: "no telegram env" };
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
    });
    const j = await r.json();
    return { ok: !!j?.ok };
  } catch {
    return { ok: false };
  }
}

function isTriggered(alert, data) {
  // รองรับ type หลัก: price_above, price_below, rsi_above, rsi_below, ai_is (Buy/Sell/Hold)
  const v = Number(alert.value);
  const price = Number(data.price ?? data.lastClose ?? NaN);
  const rsi = Number(data.rsi ?? NaN);
  const ai = (data.signal || "").toString();

  switch (alert.type) {
    case "price_above":
      return !Number.isNaN(price) && price > v;
    case "price_below":
      return !Number.isNaN(price) && price < v;
    case "rsi_above":
      return !Number.isNaN(rsi) && rsi > v;
    case "rsi_below":
      return !Number.isNaN(rsi) && rsi < v;
    case "ai_is":
      // value เป็น "Buy"|"Sell"|"Hold"
      return ai.toLowerCase() === String(alert.value || "").toLowerCase();
    default:
      return false;
  }
}

export default async function handler(req, res) {
  try {
    const base = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const store = globalThis.__ALERTS__ || new Map();
    const lastFire = globalThis.__ALERT_LASTFIRE__ || new Map();
    const alerts = Array.from(store.values());
    if (!alerts.length) return res.status(200).json({ results: [], ok: true });

    const results = [];
    // รวม symbol ไม่ให้ยิงซ้ำ
    const symbols = [...new Set(alerts.map(a => a.symbol))];

    // ดึงข้อมูลชุดเดียวพอ (ประหยัด request)
    const cache = new Map();
    for (const s of symbols) {
      const [p, s1] = await Promise.all([fetchPrice(base, s), fetchScreenerShort(base, s)]);
      cache.set(s, {
        price: p.price ?? s1.lastClose ?? null,
        rsi: p.rsi ?? s1.rsi ?? null,
        signal: p.signal ?? s1.signal ?? null,
      });
    }

    for (const a of alerts) {
      const data = cache.get(a.symbol) || {};
      const hit = isTriggered(a, data);
      if (!hit) continue;

      // กันยิงซ้ำ
      const now = Date.now();
      const last = lastFire.get(a.id) || 0;
      if (now - last < LAST_WINDOW_MS) continue;

      lastFire.set(a.id, now);
      const text =
        `🔔 Alert: ${a.symbol}\n` +
        `• Type: ${a.type}${a.value != null ? ` (${a.value})` : ""}\n` +
        `• Price: ${data.price ?? "-"} | RSI: ${data.rsi ?? "-"} | AI: ${data.signal ?? "-"}` +
        (a.note ? `\n• Note: ${a.note}` : "");

      // In-App: ให้ frontend มาอ่านผลลัพธ์นี้แล้วโชว์ toast
      const item = { id: a.id, symbol: a.symbol, message: text, channel: a.channel || "inapp", at: now };
      results.push(item);

      if (a.channel === "telegram") {
        await sendTelegram(text);
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, results });
  } catch (e) {
    console.error("alerts runner error:", e);
    return res.status(500).json({ error: "runner failed" });
  }
    }
