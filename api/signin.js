import { get, isConfigured } from "./lib/kv.js";
import { verifyPassword, createToken, setSessionCookie } from "./lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};

  // Validate
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ ok: false, error: "Valid email required." });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ ok: false, error: "Password required." });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  if (!isConfigured()) {
    return res.status(503).json({ ok: false, error: "Service unavailable — database not configured." });
  }

  // Look up user
  const user = await get(`user:${sanitizedEmail}`);
  if (!user || !user.passwordHash) {
    // Deliberate vague message to avoid user enumeration
    return res.status(401).json({ ok: false, error: "Invalid email or password." });
  }

  // Verify password
  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ ok: false, error: "Invalid email or password." });
  }

  // Issue session
  const token = createToken({ email: sanitizedEmail, name: user.name });
  setSessionCookie(res, token);

  console.log(`SIGNIN | ${user.name} | ${sanitizedEmail} | ${new Date().toISOString()}`);

  return res.status(200).json({ ok: true, redirect: "/feed.html" });
}
