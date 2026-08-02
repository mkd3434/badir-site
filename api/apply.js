// Careers application endpoint — receives job applications from /careers.
// Mirrors trial-signup.js (Resend notify + applicant confirmation) but does
// NOT enrol into any drip sequence — an applicant is not a marketing lead.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, role, links, message, rate, _gotcha } = req.body || {};

  // Honeypot: bots fill hidden fields, humans never see them. Accept silently, drop.
  if (_gotcha) {
    return res.status(200).json({ success: true, message: "Application received." });
  }

  // Validate email
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 320) {
    return res.status(400).json({ error: "Valid email required" });
  }
  const sanitizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Name required for an application
  const sanitizedName = (name || "").trim();
  if (sanitizedName.length < 2) {
    return res.status(400).json({ error: "Please tell us your name" });
  }

  const clip = (v, max) => (v || "").toString().trim().slice(0, max);
  const sanitizedRole = clip(role, 120) || "Not specified";
  const sanitizedLinks = clip(links, 1000);
  const sanitizedMessage = clip(message, 4000);
  const sanitizedRate = clip(rate, 200);
  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || "unknown";

  console.log(
    `CAREERS_APPLY | ${sanitizedName} | ${sanitizedEmail} | ${sanitizedRole} | ${timestamp} | ${ip}`
  );

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || "mustafa@badir.studio";

  if (RESEND_KEY) {
    try {
      // Notification to MKD
      const notifyLines = [
        "NEW CAREERS APPLICATION — BADIR STUDIO",
        "",
        `Name: ${sanitizedName}`,
        `Email: ${sanitizedEmail}`,
        `Role: ${sanitizedRole}`,
        `Rate expectation: ${sanitizedRate || "Not provided"}`,
        "",
        "Links / portfolio:",
        sanitizedLinks || "Not provided",
        "",
        "About them / why Badir:",
        sanitizedMessage || "Not provided",
        "",
        `Time: ${timestamp}`,
        `IP: ${ip}`,
        "",
        "— Badir Careers Bot",
      ];

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Badir Studio <notifications@badir.studio>",
          to: [NOTIFY_EMAIL],
          reply_to: sanitizedEmail,
          subject: `[Careers] ${sanitizedRole} — ${sanitizedName}`,
          text: notifyLines.join("\n"),
        }),
      });

      // Confirmation to the applicant
      const confirmLines = [
        `Hi ${sanitizedName},`,
        "",
        `Thanks for applying to Badir Studio${sanitizedRole && sanitizedRole !== "Not specified" ? ` for ${sanitizedRole}` : ""} — your application landed and I read every one personally.`,
        "",
        "We're building the founding team for the AI marketing agency for Muslim brands. If there's a fit, I'll reach out to set up a short conversation. If the timing isn't right now, I'll keep you on the bench and come back to you as we bring people on.",
        "",
        "Either way — thank you for wanting to build this with us.",
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
          subject: "Got your application — Badir Studio",
          text: confirmLines.join("\n"),
        }),
      });
    } catch (err) {
      console.error("Resend error:", err.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Application received.",
  });
}
