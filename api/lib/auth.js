// Auth helpers — password hashing (SHA-256 HMAC) + JWT session tokens
// No external dependencies — uses Web Crypto API (works everywhere)
const JWT_SECRET = process.env.JWT_SECRET || "badir-dev-secret-change-me";
const SESSION_DAYS = 30;

// --- Password hashing (HMAC-SHA256, no Node crypto needed) ---

function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toHex(arr);
}

async function hmacSha256(key, data) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return toHex(sig);
}

export async function hashPassword(password) {
  const salt = randomHex(16);
  const hash = await hmacSha256(salt, password);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const computed = await hmacSha256(salt, password);
  return computed === hash;
}

// --- JWT sessions (HMAC-SHA256 via Web Crypto) ---

function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function createToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  const sig = await hmacSha256(JWT_SECRET, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const [header, body, sig] = token.split(".");
    const expected = await hmacSha256(JWT_SECRET, `${header}.${body}`);
    if (sig !== expected) return null;
    const payload = JSON.parse(b64urlDecode(body));
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

export async function getSessionFromReq(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/badir_session=([^;]+)/);
  return match ? await verifyToken(match[1]) : null;
}
