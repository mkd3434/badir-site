export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = req.body || {};
  const { score, grade, dimensions } = data;

  if (typeof score !== "number" || !grade) {
    return res.status(400).json({ error: "Score and grade required" });
  }

  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || "unknown";
  const email = data.email ? data.email.trim().toLowerCase() : null;

  // Log to Vercel function logs
  console.log(`SCORECARD_RESULT | score:${score}/80 | grade:${grade} | ${email || "no-email"} | ${timestamp} | ${ip}`);

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || "mkd@mkdai.agency";

  if (RESEND_KEY) {
    try {
      const dimSummary = dimensions
        ? Object.entries(dimensions)
            .map(([k, v]) => `  ${k}: ${v.score}/${v.max}`)
            .join("\n")
        : "No dimension data";

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Badir Scorecard <onboarding@resend.dev>",
          to: [NOTIFY_EMAIL],
          subject: `Scorecard: ${score}/80 (${grade})${email ? ` — ${email}` : ""}`,
          text: [
            "Brand Readiness Scorecard Result",
            "=".repeat(35),
            "",
            `Score: ${score}/80`,
            `Grade: ${grade}`,
            email ? `Email: ${email}` : "Email: not provided",
            "",
            "Dimensions:",
            dimSummary,
            "",
            `Time: ${timestamp}`,
            `IP: ${ip}`,
            "",
            "— Badir Scorecard Bot",
          ].join("\n"),
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        console.error("Resend API error:", JSON.stringify(resendData));
      } else {
        console.log("Resend email sent:", resendData.id);
      }
    } catch (err) {
      console.error("Resend error:", err.message);
    }
  } else {
    console.warn("RESEND_API_KEY not set — skipping email");
  }

  return res.status(200).json({ success: true });
}
