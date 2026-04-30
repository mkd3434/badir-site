// Auth helpers — password hashing (PBKDF2) + JWT session tokens
// No external dependencies — uses Web Crypto API (works everywhere)
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_DAYS = 30;

function requireSecret(name, value) {
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

// --- Password hashing (PBKDF2 via Web Crypto — proper KDF) ---

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
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

async function pbkdf2Hash(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTES * 8
  );
  return new Uint8Array(derived);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2Hash(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const salt = fromHex(saltHex);
  const computed = await pbkdf2Hash(password, salt);
  const expected = fromHex(hashHex);
  // Constant-time comparison
  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed[i] ^ expected[i];
  }
  return diff === 0;
}

// Constant-time string comparison for tokens/keys
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
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
  const secret = requireSecret("JWT_SECRET", JWT_SECRET);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  const sig = await hmacSha256(secret, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export async function verifyToken(token) {
  const secret = requireSecret("JWT_SECRET", JWT_SECRET);
  if (!token) return null;
  try {
    const [header, body, sig] = token.split(".");
    const expected = await hmacSha256(secret, `${header}.${body}`);
    if (!timingSafeEqual(sig, expected)) return null;
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
