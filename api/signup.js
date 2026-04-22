import { get, set, sadd, isConfigured } from "./lib/kv.js";
import { hashPassword, createToken, setSessionCookie } from "./lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password } = req.body || {};

  // Validate
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ ok: false, error: "Name is required." });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ ok: false, error: "Valid email required." });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedName = name.trim();

  if (!isConfigured()) {
    return res.status(503).json({ ok: false, error: "Service unavailable — database not configured." });
  }

  // Check if user already exists
  const existing = await get(`user:${sanitizedEmail}`);
  if (existing) {
    return res.status(409).json({ ok: false, error: "An account with this email already exists. Sign in instead." });
  }

  // Create user
  const passwordHash = hashPassword(password);
  const timestamp = new Date().toISOString();

  await set(`user:${sanitizedEmail}`, {
    name: sanitizedName,
    email: sanitizedEmail,
    passwordHash,
    createdAt: timestamp,
  });
  await sadd("users:all", sanitizedEmail);

  // Issue session
  const token = createToken({ email: sanitizedEmail, name: sanitizedName });
  setSessionCookie(res, token);

  console.log(`SIGNUP | ${sanitizedName} | ${sanitizedEmail} | ${timestamp}`);

  // Also enroll in waitlist drip sequence
  try {
    const seqExists = await get(`seq:${sanitizedEmail}`);
    if (!seqExists) {
      await set(`seq:${sanitizedEmail}`, {
        email: sanitizedEmail,
        name: sanitizedName,
        source: "waitlist",
        step: 0,
        startedAt: timestamp,
        lastSentAt: timestamp,
        meta: {},
      });
      await sadd("seq:active", sanitizedEmail);
    }
  } catch (err) {
    console.error("Drip enrollment error:", err.message);
  }

  return res.status(200).json({ ok: true, redirect: "/feed.html" });
}
