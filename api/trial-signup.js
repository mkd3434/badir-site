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
        "NEW TRIAL SIGNUP — BADIR STUDIO",
        "",
        `Name: ${sanitizedName}`,
        `Email: ${sanitizedEmail}`,
        `Website: ${sanitizedUrl || "Not provided"}`,
        `Business Type: ${sanitizedType}`,
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
          subject: `[Trial] ${sanitizedName} — ${sanitizedUrl || sanitizedEmail}`,
          text: notifyLines.join("\n"),
        }),
      });

      // Welcome email to the prospect
      const welcomeLines = [
        `Hi ${sanitizedName},`,
        "",
        "Thanks for your interest in Badir Studio.",
        "",
        "I'll be in touch shortly to walk you through the setup and get your marketing dashboard live.",
        "",
        "What happens next:",
        "1. We'll schedule a quick setup call (15 min)",
        "2. We add a lightweight tracking snippet to your site",
        "3. Your dashboard goes live within 24 hours",
        "",
        "14 intelligence layers running on your website — SEO audit, competitor monitoring, AI search visibility, brand tracking, and more. All free for 14 days.",
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
          subject: "Your free trial request — next steps",
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
        source: "trial",
        step: 0,
        startedAt: timestamp,
        lastSentAt: timestamp,
        meta: { website: sanitizedUrl, businessType: sanitizedType },
      });
      await sadd("seq:active", sanitizedEmail);
    } catch (err) {
      console.error("KV error:", err.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Trial signup received.",
  });
}
