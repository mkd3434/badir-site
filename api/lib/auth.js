// Auth helpers — password hashing (scrypt) + JWT session tokens
// No external dependencies — uses Node.js built-in crypto
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "badir-dev-secret-change-me";
const SESSION_DAYS = 30;

// --- Password hashing ---

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const buf = scryptSync(password, salt, 64);
  return timingSafeEqual(buf, Buffer.from(hash, "hex"));
}

// --- JWT sessions (HMAC-SHA256, no library needed) ---

function base64url(str) {
  return Buffer.from(str).toString("base64url");
}

function base64urlDecode(str) {
  return Buffer.from(str, "base64url").toString();
}

export function createToken(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const body = base64url(JSON.stringify({ ...payload, exp }));
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const [header, body, sig] = token.split(".");
    const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Cookie helpers ---

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", [
    `badir_session=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_DAYS * 86400}`,
  ]);
}

export function getSessionFromReq(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/badir_session=([^;]+)/);
  return match ? verifyToken(match[1]) : null;
}
