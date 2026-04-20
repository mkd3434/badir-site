export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = req.body || {};
  const { name, email } = data;

  if (!name || !email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "Name and valid email required" });
  }

  const sanitized = email.trim().toLowerCase();
  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || "unknown";

  // Log to Vercel function logs
  console.log(`SURVEY_SUBMISSION | ${sanitized} | ${name} | ${timestamp} | ${ip}`);
  console.log(`SURVEY_DATA | ${JSON.stringify(data)}`);

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || "mkd@mkdai.agency";

  if (RESEND_KEY) {
    try {
      // Build a formatted summary of the survey responses
      const fields = [
        ["Name", data.name],
        ["Email", sanitized],
        ["Role", data.role],
        ["Business", data.business],
        ["Website", data.website],
        ["Stage", data.stage],
        ["Needs", Array.isArray(data.needs) ? data.needs.join(", ") : data.needs],
        ["Description", data.description],
        ["Audience", data.audience],
        ["Competitors", data.competitors],
        ["Timeline", data.timeline],
        ["Budget", data.budget],
        ["Success", data.success],
        ["Notes", data.notes],
        ["Source", data.source],
      ];

      const body = fields
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Badir Survey <survey@badir.studio>",
          to: [NOTIFY_EMAIL],
          subject: `New project inquiry: ${data.name} — ${data.business || "No business name"}`,
          text: [
            "New Project Discovery Survey Submission",
            "=".repeat(40),
            "",
            body,
            "",
            `Submitted: ${timestamp}`,
            `IP: ${ip}`,
            "",
            "— Badir Survey Bot",
          ].join("\n"),
        }),
      });

      // Confirmation to the submitter
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mustafa from Badir <mustafa@badir.studio>",
          to: [sanitized],
          subject: "We got your project details",
          text: [
            `Assalamu Alaikum ${data.name},`,
            "",
            "Thanks for filling out the project discovery survey.",
            "We've received your details and will review everything within 48 hours.",
            "",
            "What happens next:",
            "1. We review your project details and market",
            "2. We'll reach out to schedule a free 30-min discovery call",
            "3. If it's a fit, we start with the Discovery phase",
            "",
            "In the meantime, if you haven't already:",
            "- Check your brand readiness: https://badir.studio/scorecard",
            "",
            "Talk soon,",
            "Mustafa Kivanc Demirsoy",
            "Founder, Badir",
            "",
            "badir.studio",
          ].join("\n"),
        }),
      });
    } catch (err) {
      console.error("Resend error:", err.message);
    }
  }

  return res.status(200).json({ success: true });
}
