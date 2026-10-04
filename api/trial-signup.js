import { set, sadd, isConfigured, screen } from "./lib/kv.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, website_url, business_type, source, scorecard_score, scorecard_grade,
          company_website, rendered_at } = req.body || {};

  // Validate required fields
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 320) {
    return res.status(400).json({ error: "Valid email required" });
  }
  // Name is optional on the founding-waitlist form.

  const sanitizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const sanitizedName = (name || "").trim();
  const sanitizedUrl = (website_url || "").trim();
  const sanitizedType = (business_type || "not specified").trim();
  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || "unknown";

  // ── Spam screen ────────────────────────────────────────────────────────
  // Two bot signups reached the founding waitlist on 2026-10-03/04 and read as
  // real leads. Screen before notifying, emailing or enrolling anyone.
  let spam = { verdict: "ok", duplicate: false, reasons: [] };
  try {
    spam = await screen({
      email: sanitizedEmail,
      name: sanitizedName,
      url: sanitizedUrl,
      ip,
      honeypot: company_website,
      renderedAt: rendered_at,
      formKey: "trial",
    });
  } catch (err) {
    console.error("antispam error (failing open):", err.message);
  }

  console.log(`TRIAL_SIGNUP | ${spam.verdict}${spam.duplicate ? "+dup" : ""} | ${sanitizedName} | ${sanitizedEmail} | ${sanitizedUrl} | ${sanitizedType} | ${timestamp} | ${ip}${spam.reasons.length ? " | " + spam.reasons.join("; ") : ""}`);

  // Blocked: record it and return the same 200 a real submission gets, so the
  // bot learns nothing. No notification, no welcome email, no drip.
  if (spam.verdict === "block") {
    if (isConfigured()) {
      try {
        await set(`spam:${timestamp}:${sanitizedEmail}`, { email: sanitizedEmail, name: sanitizedName, url: sanitizedUrl, ip, reasons: spam.reasons, at: timestamp });
        await sadd("spam:blocked", sanitizedEmail);
      } catch (err) { console.error("KV error:", err.message); }
    }
    return res.status(200).json({ success: true, message: "Founding waitlist request received." });
  }

  const suspect = spam.verdict === "quarantine";

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || "mustafa@badir.studio";

  if (RESEND_KEY) {
    try {
      // Notification to MKD
      const notifyLines = [
        suspect ? "⚠ SUSPECTED SPAM — NOT a confirmed lead" : "NEW FOUNDING WAITLIST — BADIR STUDIO",
        "",
        `Name: ${sanitizedName}`,
        `Email: ${sanitizedEmail}`,
        `Store URL: ${sanitizedUrl || "Not provided"}`,
        `Source: ${source || "offer-page"}`,
      ];

      if (scorecard_score) {
        notifyLines.push("", `Scorecard Score: ${scorecard_score}`, `Scorecard Grade: ${scorecard_grade || "N/A"}`);
      }

      if (suspect) {
        notifyLines.push(
          "",
          "WHY THIS WAS FLAGGED:",
          ...spam.reasons.map((r) => `  - ${r}`),
          "",
          "No welcome email was sent and this address was NOT enrolled in the",
          "drip. If it is genuine, reply to the sender yourself.",
        );
      }
      if (spam.duplicate) {
        notifyLines.push("", "NOTE: this email is already on the waitlist. Not re-enrolled.");
      }

      notifyLines.push("", `Time: ${timestamp}`, `IP: ${ip}`, "", "— Badir Founding Waitlist Bot");

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Badir Studio <notifications@badir.studio>",
          to: [NOTIFY_EMAIL],
          subject: `${suspect ? "[SUSPECTED SPAM]" : "[Founding]"} ${sanitizedName} — ${sanitizedUrl || sanitizedEmail}`,
          text: notifyLines.join("\n"),
        }),
      });

      // Welcome email to the prospect — skipped for suspected spam (protects
      // badir.studio's sender reputation) and for addresses already enrolled.
      const welcomeLines = suspect || spam.duplicate ? null : [
        `Hi ${sanitizedName || "there"},`,
        "",
        "Your founding spot in the Badir Studio cohort is reserved — thank you for being one of the first.",
        "",
        "We're onboarding a limited founding cohort of Muslim brands, and founding members go first. Here's what that means for you:",
        "",
        "1. I'll personally review your store, then reach out to book a short call to walk you through exactly where you're leaking sales.",
        "2. You've locked in founding terms — a founding rate on the build and the ongoing run, if you decide to go ahead.",
        "3. You leave the audit with at least 5 specific leaks, ranked by what each one costs you — yours to keep, whether or not we work together.",
        "",
        "Nothing else to do right now. I'll be in touch to schedule your audit call.",
        "",
        "No pressure, no obligation.",
        "",
        "Talk soon,",
        "Mustafa Kivanc Demirsoy",
        "Founder, Badir Studio",
        "",
        "badir.studio",
      ];

      if (welcomeLines) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mustafa from Badir Studio <mustafa@badir.studio>",
            to: [sanitizedEmail],
            subject: "Your founding spot is reserved — next steps",
            text: welcomeLines.join("\n"),
          }),
        });
      }
    } catch (err) {
      console.error("Resend error:", err.message);
    }
  }

  // Store in KV. Suspected spam goes to a quarantine key, never the drip.
  if (isConfigured() && suspect) {
    try {
      await set(`quarantine:${timestamp}:${sanitizedEmail}`, { email: sanitizedEmail, name: sanitizedName, url: sanitizedUrl, ip, reasons: spam.reasons, at: timestamp });
      await sadd("quarantine:pending", sanitizedEmail);
    } catch (err) { console.error("KV error:", err.message); }
  } else if (isConfigured() && !spam.duplicate) {
    try {
      await set(`seq:${sanitizedEmail}`, {
        email: sanitizedEmail,
        name: sanitizedName,
        source: "founding-waitlist",
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
    message: "Founding waitlist request received.",
  });
}
