// Careers endpoint.
//   POST /api/apply            → receive a job application (Resend notify + confirmation, KV store)
//   GET  /api/apply?key=…      → fail-closed admin view of collected applications
//   GET  /api/apply?health=1   → non-PII probe { kvConfigured, count }
// Two methods, one file — keeps us under Vercel's 12-function cap.
import crypto from "node:crypto";
import { get, set, sadd, smembers, isConfigured } from "./lib/kv.js";

function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function linkify(escaped) {
  return escaped.replace(
    /(https?:\/\/[^\s,<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

// GET — admin view. Fail-closed: no data unless ADMIN_KEY is set AND matches.
async function adminView(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  const q = req.query || {};

  // Non-PII health probe — confirm storage is live without exposing applicant data.
  if (q.health) {
    let count = 0;
    if (isConfigured()) {
      try {
        count = (await smembers("apply:index")).length;
      } catch {
        /* ignore */
      }
    }
    return res.status(200).json({ ok: true, kvConfigured: isConfigured(), count });
  }

  const ADMIN_KEY = process.env.ADMIN_KEY;
  if (!ADMIN_KEY) {
    return res.status(503).json({
      error: "Admin view not configured. Set ADMIN_KEY in the Vercel environment to enable it.",
    });
  }
  const provided = req.headers["x-admin-key"] || q.key;
  if (!safeEqual(provided, ADMIN_KEY)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!isConfigured()) {
    return res.status(200).json({
      applications: [],
      note: "KV storage not configured — applications currently arrive by email only.",
    });
  }

  let ids = [];
  try {
    ids = await smembers("apply:index");
  } catch (err) {
    console.error("KV error:", err.message);
  }
  const records = (await Promise.all(ids.map((id) => get(`apply:${id}`)))).filter(Boolean);
  records.sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));

  if (q.format === "json") {
    return res.status(200).json({ count: records.length, applications: records });
  }

  const rows = records
    .map(
      (r) => `
    <tr>
      <td class="ts">${esc((r.timestamp || "").replace("T", " ").slice(0, 16))}</td>
      <td class="nm">${esc(r.name)}</td>
      <td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
      <td>${esc(r.role)}</td>
      <td class="links">${linkify(esc(r.links))}</td>
      <td class="msg">${esc(r.message)}</td>
      <td class="rate">${esc(r.rate)}</td>
    </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Applications — Badir Studio</title>
<style>
  :root { --emerald:#10B981; --bg:#050505; --surface:#101012; --border:#26262b; --text:#e7e7ea; --muted:#8a8a93; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  h1 { font-size:16px; margin:0; font-weight:700; }
  .count { color:var(--emerald); font-weight:700; }
  .hint { color:var(--muted); font-size:12px; }
  .wrap { padding:16px 24px 60px; overflow-x:auto; }
  table { border-collapse:collapse; width:100%; min-width:900px; }
  th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:top; }
  th { position:sticky; top:0; background:var(--surface); color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.5px; }
  tr:hover td { background:#0d0d0f; }
  td.ts { color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
  td.nm { font-weight:600; white-space:nowrap; }
  td.links { max-width:240px; word-break:break-all; }
  td.msg { max-width:360px; color:#c9c9cf; }
  td.rate { white-space:nowrap; color:var(--muted); }
  a { color:var(--emerald); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .empty { padding:60px 24px; color:var(--muted); text-align:center; }
</style></head>
<body>
  <header>
    <h1>Badir Studio — Applications</h1>
    <span class="count">${records.length}</span>
    <span class="hint">newest first · <a href="?key=${esc(q.key || "")}&amp;format=json">JSON</a></span>
  </header>
  <div class="wrap">
    ${
      records.length
        ? `<table>
      <thead><tr><th>When</th><th>Name</th><th>Email</th><th>Role</th><th>Links</th><th>About / why Badir</th><th>Rate</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
        : `<div class="empty">No applications yet. They'll show up here as they come in.</div>`
    }
  </div>
</body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return adminView(req, res);
  }
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

  // Persist to KV so applications collect in one list (readable via /api/applications).
  // Guarded — if KV isn't configured, applications still arrive by email.
  if (isConfigured()) {
    try {
      const id = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
      await set(`apply:${id}`, {
        id,
        name: sanitizedName,
        email: sanitizedEmail,
        role: sanitizedRole,
        links: sanitizedLinks,
        message: sanitizedMessage,
        rate: sanitizedRate,
        timestamp,
        ip,
      });
      await sadd("apply:index", id);
    } catch (err) {
      console.error("KV error:", err.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Application received.",
  });
}
