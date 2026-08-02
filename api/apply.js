// Careers endpoint (one file — keeps us under Vercel's 12-function cap).
//   POST   /api/apply            → receive a job application (public; Resend notify + confirmation, KV store)
//   GET    /api/apply?key=…      → fail-closed admin view of collected applications
//   GET    /api/apply?health=1   → non-PII probe { kvConfigured, count }
//   PATCH  /api/apply {id,status}→ admin: mark reviewed / archived / new
//   DELETE /api/apply {id}       → admin: permanently delete an application
import { get, set, del, sadd, srem, smembers, isConfigured } from "./lib/kv.js";
import { timingSafeEqual } from "./lib/auth.js";

const STATUSES = ["new", "reviewed", "archived"];

// Fail-closed admin auth. Bearer header (project convention) or ?key= / x-admin-key.
function adminAuth(req) {
  const ADMIN_KEY = process.env.ADMIN_KEY;
  if (!ADMIN_KEY) return { ok: false, code: 503, error: "Admin not configured. Set ADMIN_KEY." };
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const q = req.query || {};
  const provided = bearer || req.headers["x-admin-key"] || q.key || "";
  if (!timingSafeEqual(provided, ADMIN_KEY)) return { ok: false, code: 401, error: "Unauthorized" };
  return { ok: true };
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

// RFC 4180 cell — wrap in quotes, double internal quotes (safe for commas/newlines).
function csvCell(v) {
  return `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
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

  const auth = adminAuth(req);
  if (!auth.ok) return res.status(auth.code).json({ error: auth.error });
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

  if (q.format === "csv") {
    const header = ["When", "Status", "Name", "Email", "Role", "Links", "Message", "Rate"];
    const lines = [header.map(csvCell).join(",")];
    for (const r of records) {
      lines.push(
        [
          (r.timestamp || "").replace("T", " ").slice(0, 16),
          r.status || "new",
          r.name,
          r.email,
          r.role,
          r.links,
          r.message,
          r.rate,
        ]
          .map(csvCell)
          .join(",")
      );
    }
    const csv = "\uFEFF" + lines.join("\r\n"); // BOM so Excel reads UTF-8 correctly
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="badir-applications-${date}.csv"`);
    return res.status(200).send(csv);
  }

  const KEY = q.key || "";
  const showArchived = !!q.archived;
  const activeCount = records.filter((r) => (r.status || "new") !== "archived").length;
  const archivedCount = records.length - activeCount;
  const visible = records.filter((r) =>
    showArchived ? (r.status || "new") === "archived" : (r.status || "new") !== "archived"
  );

  const badge = (s) => {
    const st = s || "new";
    return `<span class="badge b-${st}">${st}</span>`;
  };
  const actions = (r) => {
    const st = r.status || "new";
    const id = esc(r.id);
    const b = [];
    if (st !== "reviewed") b.push(`<button data-act="reviewed" data-id="${id}">Reviewed</button>`);
    if (st === "archived") b.push(`<button data-act="new" data-id="${id}">Restore</button>`);
    else b.push(`<button data-act="archived" data-id="${id}">Archive</button>`);
    b.push(`<button class="danger" data-act="delete" data-id="${id}">Delete</button>`);
    return b.join(" ");
  };

  const rows = visible
    .map(
      (r) => `
    <tr>
      <td class="ts">${esc((r.timestamp || "").replace("T", " ").slice(0, 16))}</td>
      <td>${badge(r.status)}</td>
      <td class="nm">${esc(r.name)}</td>
      <td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
      <td>${esc(r.role)}</td>
      <td class="links">${linkify(esc(r.links))}</td>
      <td class="msg">${esc(r.message)}</td>
      <td class="rate">${esc(r.rate)}</td>
      <td class="act">${actions(r)}</td>
    </tr>`
    )
    .join("");

  const toggleLink = showArchived
    ? `<a href="?key=${esc(KEY)}">&larr; Active (${activeCount})</a>`
    : `<a href="?key=${esc(KEY)}&amp;archived=1">Archived (${archivedCount})</a>`;

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
  table { border-collapse:collapse; width:100%; min-width:1040px; }
  th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); vertical-align:top; }
  th { position:sticky; top:0; background:var(--surface); color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.5px; }
  tr:hover td { background:#0d0d0f; }
  td.ts { color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
  td.nm { font-weight:600; white-space:nowrap; }
  td.links { max-width:240px; word-break:break-all; }
  td.msg { max-width:360px; color:#c9c9cf; }
  td.rate { white-space:nowrap; color:var(--muted); }
  td.act { white-space:nowrap; }
  a { color:var(--emerald); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .badge { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:2px 8px; border-radius:999px; }
  .b-new { background:rgba(16,185,129,.15); color:var(--emerald); }
  .b-reviewed { background:rgba(96,165,250,.15); color:#60A5FA; }
  .b-archived { background:rgba(138,138,147,.15); color:var(--muted); }
  button { font:600 12px/1 inherit; color:var(--text); background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:6px 10px; cursor:pointer; margin:0 2px 2px 0; }
  button:hover { border-color:var(--emerald); color:var(--emerald); }
  button.danger:hover { border-color:#EF4444; color:#EF4444; }
  .empty { padding:60px 24px; color:var(--muted); text-align:center; }
</style></head>
<body>
  <header>
    <h1>Badir Studio — Applications</h1>
    <span class="count">${visible.length}</span>
    <span class="hint">${showArchived ? "archived" : "active"} · newest first</span>
    <span class="hint">${toggleLink} · <a href="?key=${esc(KEY)}&amp;format=csv">Download CSV</a> · <a href="?key=${esc(KEY)}&amp;format=json">JSON</a></span>
  </header>
  <div class="wrap">
    ${
      visible.length
        ? `<table>
      <thead><tr><th>When</th><th>Status</th><th>Name</th><th>Email</th><th>Role</th><th>Links</th><th>About / why Badir</th><th>Rate</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
        : `<div class="empty">${showArchived ? "No archived applications." : "No applications yet. They'll show up here as they come in."}</div>`
    }
  </div>
  <script>
    // Key is read client-side from the URL — never injected server-side (no reflected XSS).
    const KEY = new URLSearchParams(location.search).get('key') || '';
    async function act(method, id, status) {
      const body = { id };
      if (status) body.status = status;
      const res = await fetch('/api/apply', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
        body: JSON.stringify(body)
      });
      if (res.ok) { location.reload(); }
      else { alert('Action failed (' + res.status + '). Make sure you opened this page with ?key=…'); }
    }
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const a = btn.getAttribute('data-act');
      if (a === 'delete') { if (confirm('Delete this application permanently? This cannot be undone.')) act('DELETE', id); }
      else act('PATCH', id, a);
    });
  </script>
</body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}

// DELETE — permanently remove an application.
async function adminDelete(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const auth = adminAuth(req);
  if (!auth.ok) return res.status(auth.code).json({ error: auth.error });
  if (!isConfigured()) return res.status(503).json({ error: "KV not configured" });
  const id = (req.body && req.body.id) || (req.query && req.query.id) || "";
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    await del(`apply:${id}`);
    await srem("apply:index", id);
  } catch (err) {
    console.error("KV error:", err.message);
    return res.status(500).json({ error: "Delete failed" });
  }
  return res.status(200).json({ ok: true, deleted: id });
}

// PATCH — update an application's status (new | reviewed | archived).
async function adminPatch(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const auth = adminAuth(req);
  if (!auth.ok) return res.status(auth.code).json({ error: auth.error });
  if (!isConfigured()) return res.status(503).json({ error: "KV not configured" });
  const id = (req.body && req.body.id) || "";
  const status = (req.body && req.body.status) || "";
  if (!id) return res.status(400).json({ error: "Missing id" });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
  let rec;
  try {
    rec = await get(`apply:${id}`);
  } catch (err) {
    console.error("KV error:", err.message);
    return res.status(500).json({ error: "Read failed" });
  }
  if (!rec) return res.status(404).json({ error: "Not found" });
  try {
    await set(`apply:${id}`, { ...rec, status });
  } catch (err) {
    console.error("KV error:", err.message);
    return res.status(500).json({ error: "Update failed" });
  }
  return res.status(200).json({ ok: true, id, status });
}

export default async function handler(req, res) {
  if (req.method === "GET") return adminView(req, res);
  if (req.method === "DELETE") return adminDelete(req, res);
  if (req.method === "PATCH") return adminPatch(req, res);
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
