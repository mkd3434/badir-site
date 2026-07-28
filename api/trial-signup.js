import { set, sadd, isConfigured } from "./lib/kv.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, website_url, business_type, source, scorecard_score, scorecard_grade } = req.body || {};

  // Validate required fields
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 320) {
    return res.status(400).json({ error: "Valid email required" });
  }
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Name required" });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const sanitizedName = name.trim();
  const sanitizedUrl = (website_url || "").trim();
  const sanitizedType = (business_type || "not specified").trim();
  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || "unknown";

  // Log to Vercel function logs
  console.log(`TRIAL_SIGNUP | ${sanitizedName} | ${sanitizedEmail} | ${sanitizedUrl} | ${sanitizedType} | ${timestamp} | ${ip}`);

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || "mustafa@badir.studio";

  if (RESEND_KEY) {
    try {
      // Notification to MKD
      const notifyLines = [
        "NEW AUDIT REQUEST — BADIR STUDIO",
        "",
        `Name: ${sanitizedName}`,
        `Email: ${sanitizedEmail}`,
        `Store URL: ${sanitizedUrl || "Not provided"}`,
        `Source: ${source || "offer-page"}`,
      ];

      if (scorecard_score) {
        notifyLines.push("", `Scorecard Score: ${scorecard_score}`, `Scorecard Grade: ${scorecard_grade || "N/A"}`);
      }

      notifyLines.push("", `Time: ${timestamp}`, `IP: ${ip}`, "", "— Badir Trial Signup Bot");

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Badir Studio <notifications@badir.studio>",
          to: [NOTIFY_EMAIL],
          subject: `[Audit] ${sanitizedName} — ${sanitizedUrl || sanitizedEmail}`,
          text: notifyLines.join("\n"),
        }),
      });

      // Welcome email to the prospect
      const welcomeLines = [
        `Hi ${sanitizedName},`,
        "",
        "Thanks for requesting your free sales audit from Badir Studio.",
        "",
        "I'll personally review your store, then reach out to book a short call to walk you through exactly where you're leaking sales — and the highest-impact ways to grow.",
        "",
        "What happens next:",
        "1. I run the audit on your store",
        "2. We book a quick call to go through the findings together",
        "3. You leave with at least 5 specific, ranked ways to grow your sales — yours to keep, whether or not we work together",
        "",
        "No pressure, no obligation.",
        "",
        "Talk soon,",
        "Mustafa Kivanc Demirsoy",
        "Founder, Badir Studio",
        "",
        "badir.studio",
      ];

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mustafa from Badir Studio <mustafa@badir.studio>",
          to: [sanitizedEmail],
          subject: "Your free sales audit — next steps",
          text: welcomeLines.join("\n"),
        }),
      });
    } catch (err) {
      console.error("Resend error:", err.message);
    }
  }

  // Store in KV for drip sequence
  if (isConfigured()) {
    try {
      await set(`seq:${sanitizedEmail}`, {
        email: sanitizedEmail,
        name: sanitizedName,
        source: "audit",
        step: 0,
        startedAt: timestamp,
        lastSentAt: timestamp,
        meta: { website: sanitizedUrl },
      });
      await sadd("seq:active", sanitizedEmail);
    } catch (err) {
      console.error("KV error:", err.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Audit request received.",
  });
}
