// /pages/api/alerts.js
// เก็บ alerts ไว้ในหน่วยความจำ (เดโม). ถ้ารีสตาร์ทจะหาย — พร้อมรองรับย้ายไปฐานข้อมูลได้ง่าย

export const config = { runtime: "nodejs" };

if (!globalThis.__ALERTS__) globalThis.__ALERTS__ = new Map(); // id -> alert
if (!globalThis.__ALERT_LASTFIRE__) globalThis.__ALERT_LASTFIRE__ = new Map(); // id -> ts

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // คืนรายการทั้งหมด
      const all = Array.from(globalThis.__ALERTS__.values());
      return res.status(200).json({ results: all });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      // alert schema (อย่างน้อย)
      // { id, symbol, type, op, value, channel: "inapp"|"telegram", note? }
      if (!body?.id || !body?.symbol || !body?.type) {
        return res.status(400).json({ error: "invalid alert body" });
      }
      globalThis.__ALERTS__.set(body.id, {
        ...body,
        createdAt: Date.now(),
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const id = (req.query.id || "").trim();
      if (!id) return res.status(400).json({ error: "id required" });
      globalThis.__ALERTS__.delete(id);
      globalThis.__ALERT_LASTFIRE__.delete(id);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("alerts api error:", e);
    return res.status(500).json({ error: "internal error" });
  }
}
