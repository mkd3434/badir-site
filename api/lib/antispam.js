// Shared spam screen for public lead forms.
//
// Written 2026-10-04 after two bot signups reached the founding waitlist and
// read as real leads. Both named a "store URL" whose domain had no DNS records
// at all, both came from the same /24, and one paired a Hispanic-American name
// with a Polish email address.
//
// Design rules:
//  - FAIL OPEN on infrastructure errors. A KV or DNS outage must never block a
//    real lead; it only means we screen less thoroughly for that request.
//  - Never tell the client it was flagged. Callers should still return 200.
//  - Quarantine, don't delete. A false positive must still be recoverable.

import { incr, expire, exists } from "./kv.js";

const HARD = "hard";   // block outright
const SOFT = "soft";   // two or more => quarantine

// A store-audit request should name a store that exists.
async function domainResolves(url) {
  let host;
  try {
    host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return { resolved: false, reason: "unparseable" };
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return { resolved: false, reason: "not a domain" };

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 2500);
  try {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`,
      { headers: { Accept: "application/dns-json" }, signal: ctl.signal },
    );
    const j = await r.json();
    // Answer present => the domain exists. NXDOMAIN (status 3) => it does not.
    if (Array.isArray(j.Answer) && j.Answer.length) return { resolved: true };
    if (j.Status === 3) return { resolved: false, reason: "NXDOMAIN" };
    return { resolved: true, uncertain: true }; // fail open on anything ambiguous
  } catch {
    return { resolved: true, uncertain: true }; // fail open on timeout/network
  } finally {
    clearTimeout(t);
  }
}

export async function screen({ email, name, url, ip, honeypot, renderedAt, formKey = "form" }) {
  const flags = [];
  const add = (sev, reason) => flags.push({ sev, reason });

  // 1. Honeypot — a hidden field no human sees, let alone fills.
  if (honeypot && String(honeypot).trim() !== "") add(HARD, "honeypot filled");

  // 2. Submitted implausibly fast after the form rendered.
  const ms = Number(renderedAt) ? Date.now() - Number(renderedAt) : null;
  if (ms !== null && ms >= 0 && ms < 2500) add(SOFT, `submitted in ${ms}ms`);

  // 3. Per-IP rate limit (fails open if KV is unavailable).
  if (ip && ip !== "unknown") {
    const safeIp = String(ip).split(",")[0].trim().replace(/[^0-9a-fA-F:.]/g, "");
    const hour = new Date().toISOString().slice(0, 13);
    try {
      const key = `rl:${formKey}:${safeIp}:${hour}`;
      const n = await incr(key);
      if (n === 1) await expire(key, 3600);
      if (n > 3) add(HARD, `rate limit: ${n} submissions from this IP this hour`);
    } catch { /* fail open */ }
  }

  // 4. The store must exist. This is the signal that catches the real cases.
  if (url && url.trim()) {
    const d = await domainResolves(url.trim());
    if (!d.resolved) add(SOFT, `store domain does not resolve (${d.reason})`);
  }

  // 5. Already on the list — not spam, just don't re-notify or re-email.
  let duplicate = false;
  try {
    if (email) duplicate = await exists(`seq:${email}`);
  } catch { /* fail open */ }

  const hard = flags.some((f) => f.sev === HARD);
  const softCount = flags.filter((f) => f.sev === SOFT).length;
  const verdict = hard ? "block" : softCount >= 1 ? "quarantine" : "ok";

  return {
    verdict,                 // "ok" | "quarantine" | "block"
    duplicate,
    reasons: flags.map((f) => f.reason),
  };
}
