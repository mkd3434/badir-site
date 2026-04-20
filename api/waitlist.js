export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit: basic check via header (Vercel handles DDoS at edge)
  const ip = req.headers["x-forwarded-for"] || "unknown";

  const { email, source, metadata } = req.body || {};

  // Validate email
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 320) {
    return res.status(400).json({ error: "Valid email required" });
  }

  // Sanitize — strip anything that isn't a valid email character
  const sanitized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const timestamp = new Date().toISOString();
  const isApplication = source === "builder-application";

  // Always log to Vercel function logs (viewable in dashboard)
  console.log(`${isApplication ? "BUILDER_APPLICATION" : "WAITLIST_SIGNUP"} | ${sanitized} | ${timestamp} | ${ip} | ${isApplication ? JSON.stringify(metadata) : ""}`);

  // Send notification via Resend if configured
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || "mkd@mkdai.agency";

  if (RESEND_KEY) {
    try {
      if (isApplication && metadata) {
        // Builder application — rich notification
        const dims = metadata.dimensions || {};
        const hasScorecard = metadata.score > 0 && dims.skills_craft !== undefined;

        const notifyLines = [
          `NEW BUILDER APPLICATION — ${(metadata.track || "Landing Page").toUpperCase()}`,
          "",
          `Name: ${metadata.name || "Not provided"}`,
          `Email: ${sanitized}`,
          `Skills: ${metadata.skills || "Not provided"}`,
          `Portfolio/Link: ${metadata.link || "Not provided"}`,
        ];

        if (hasScorecard) {
          notifyLines.push(
            "",
            `SCORE: ${metadata.score}/100 → Track: ${metadata.track}`,
            "",
            "Dimension Breakdown:",
            `  Skills & Craft:   ${dims.skills_craft || 0}/20`,
            `  Availability:     ${dims.availability || 0}/20`,
            `  Builder Mindset:  ${dims.builder_mindset || 0}/20`,
            `  Community Fit:    ${dims.community_fit || 0}/20`,
            `  Portfolio:        ${dims.portfolio || 0}/20`
          );
        }

        if (metadata.location) notifyLines.push(`Location: ${metadata.location}`);
        if (metadata.stage) notifyLines.push(`Stage: ${metadata.stage}`);
        if (metadata.preferred_day) notifyLines.push(`Preferred Day: ${metadata.preferred_day}`);
        if (metadata.preferred_time) notifyLines.push(`Preferred Time: ${metadata.preferred_time}`);
        if (metadata.building) notifyLines.push("", `What they're building:`, metadata.building);

        notifyLines.push("", `Time: ${timestamp}`, `IP: ${ip}`, "", "— Badir Builder Application Bot");

        const notifyText = notifyLines.join("\n");
        const subjectName = metadata.name || sanitized;
        const subjectScore = hasScorecard ? ` — ${metadata.score}/100` : "";

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Badir Applications <waitlist@badir.studio>",
            to: [NOTIFY_EMAIL],
            subject: `[${metadata.track || "Builder"}] ${subjectName}${subjectScore}`,
            text: notifyText,
          }),
        });

        // Welcome email for applicant
        const welcomeLines = [
          `Assalamu Alaikum${metadata.name ? " " + metadata.name : ""},`,
          "",
          "Your builder application has been received.",
        ];

        if (hasScorecard) {
          welcomeLines.push(
            `You scored ${metadata.score}/100 and matched the ${metadata.track} track.`
          );
        }

        welcomeLines.push(
          "",
          "I review every application personally. You'll hear back from me soon.",
          "",
          "In the meantime:",
          "- Check your brand readiness: https://badir.studio/scorecard",
          "- Tell us about your project: https://badir.studio/survey",
          "",
          "Talk soon,",
          "Mustafa Kivanc Demirsoy",
          "Founder, Badir",
          "",
          "badir.studio"
        );

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mustafa from Badir <mustafa@badir.studio>",
            to: [sanitized],
            subject: "Application received. Bismillah.",
            text: welcomeLines.join("\n"),
          }),
        });
      } else {
        // Regular waitlist signup
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Badir Waitlist <waitlist@badir.studio>",
            to: [NOTIFY_EMAIL],
            subject: `New Badir signup: ${sanitized}`,
            text: [
              "New waitlist signup for Badir",
              "",
              `Email: ${sanitized}`,
              `Source: ${source || "waitlist"}`,
              `Time: ${timestamp}`,
              `IP: ${ip}`,
              "",
              "— Badir Waitlist Bot",
            ].join("\n"),
          }),
        });

        // Send welcome email to subscriber
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mustafa from Badir <mustafa@badir.studio>",
            to: [sanitized],
            subject: "You're in. Bismillah.",
            text: [
              "Assalamu Alaikum,",
              "",
              "You just joined the Badir waitlist. Welcome.",
              "",
              "Badir is a product studio and builder community for Muslims who ship.",
              "We're launching soon with weekend build sprints, AI-powered co-building,",
              "and a community of builders who hold each other accountable.",
              "",
              "In the meantime:",
              "- Check your brand readiness: https://badir.studio/scorecard",
              "- Tell us about your project: https://badir.studio/survey",
              "",
              "Talk soon,",
              "Mustafa Kivanc Demirsoy",
              "Founder, Badir",
              "",
              "badir.studio",
            ].join("\n"),
          }),
        });
      }
    } catch (err) {
      // Log but don't fail the signup
      console.error("Resend error:", err.message);
    }
  }

  return res.status(200).json({ success: true, message: isApplication ? "Application received." : "You're in." });
}
