// Vercel KV (Upstash Redis) REST API wrapper — no SDK needed
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

async function cmd(...args) {
  if (!URL || !TOKEN) return null;
  const res = await fetch(`${URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
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
  return Boolean(URL && TOKEN);
}
