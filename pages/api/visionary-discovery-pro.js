// ✅ /pages/api/visionary-discovery-pro.js
import { runFullDiscovery } from "../../server/visionary-discovery-pro";

export default async function handler(req, res) {
  try {
    const result = await runFullDiscovery();
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Discovery error:", err);
    res.status(500).json({ error: err.message });
  }
}
