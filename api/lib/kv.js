// Vercel KV (Upstash Redis) REST API wrapper — no SDK needed
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function cmd(...args) {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  return data.result;
}

export async function get(key) {
  const val = await cmd("GET", key);
  if (!val) return null;
  try { return JSON.parse(val); } catch { return val; }
}

export async function set(key, value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return cmd("SET", key, serialized);
}

export async function sadd(key, member) {
  return cmd("SADD", key, member);
}

export async function srem(key, member) {
  return cmd("SREM", key, member);
}

export async function smembers(key) {
  return cmd("SMEMBERS", key) || [];
}

export function isConfigured() {
  return Boolean(KV_URL && KV_TOKEN);
}
