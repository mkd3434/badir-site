import { get, smembers, isConfigured } from "./lib/kv.js";
import { timingSafeEqual } from "./lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth via Authorization header (Bearer token)
  const ADMIN_KEY = process.env.ADMIN_KEY;
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "Admin access not configured" });
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || !timingSafeEqual(token, ADMIN_KEY)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isConfigured()) {
    return res.status(503).json({ error: "KV not configured" });
  }

  try {
    const source = req.query.source || "ldj";

    if (source === "ldj") {
      const emails = await smembers("ldj:all");
      if (!emails || emails.length === 0) {
        return res.status(200).json({ registrations: [], count: 0 });
      }

      const registrations = [];
      for (const email of emails) {
        const data = await get(`ldj:${email}`);
        if (data) registrations.push(data);
      }

      // Sort newest first
      registrations.sort((a, b) =>
        (b.registeredAt || "").localeCompare(a.registeredAt || "")
      );

      return res.status(200).json({
        registrations,
        count: registrations.length,
      });
    }

    // Generic: list all active subscribers
    const emails = await smembers("seq:active");
    if (!emails || emails.length === 0) {
      return res.status(200).json({ subscribers: [], count: 0 });
    }

    const subscribers = [];
    for (const email of emails) {
      const data = await get(`seq:${email}`);
      if (data) subscribers.push(data);
    }

    return res.status(200).json({
      subscribers,
      count: subscribers.length,
    });
  } catch (err) {
    console.error("Registrations error:", err.message);
    return res.status(500).json({ error: "Failed to fetch registrations" });
  }
}
