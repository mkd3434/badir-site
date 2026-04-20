// Daily cron job — sends due drip sequence emails via Resend
// Configured in vercel.json: runs at 0 21 * * * (9 AM NZT = 21:00 UTC)

import { get, set, smembers, srem, isConfigured } from "../lib/kv.js";
import { getSequence } from "../lib/sequences.js";

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = "Mustafa from Badir Studio <mustafa@badir.studio>";

function daysSince(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

async function sendEmail(to, subject, text) {
  if (!RESEND_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isConfigured()) {
    return res.status(200).json({ skipped: true, reason: "KV not configured" });
  }

  const emails = await smembers("seq:active");
  if (!emails || emails.length === 0) {
    return res.status(200).json({ processed: 0 });
  }

  let sent = 0;
  let completed = 0;
  let skipped = 0;

  for (const email of emails) {
    const sub = await get(`seq:${email}`);
    if (!sub) {
      await srem("seq:active", email);
      continue;
    }

    // Skip unsubscribed
    if (sub.unsubscribed) {
      await srem("seq:active", email);
      skipped++;
      continue;
    }

    const sequence = getSequence(sub.source);
    if (!sequence) {
      await srem("seq:active", email);
      continue;
    }

    const nextStep = sub.step + 1;

    // Check if sequence is complete
    if (nextStep > sequence.length) {
      await srem("seq:active", email);
      completed++;
      continue;
    }

    // For scorecard, step 0 is the first email (sent by cron, not by the form handler)
    // For trial/waitlist, step 0 welcome is sent by the form handler, cron starts at step 1
    const stepIndex = sub.source === "scorecard" ? nextStep - 1 : nextStep - 1;
    if (stepIndex >= sequence.length) {
      await srem("seq:active", email);
      completed++;
      continue;
    }

    const step = sequence[stepIndex];

    // Check if it's time to send (based on day offset from signup)
    const elapsed = daysSince(sub.startedAt);
    if (elapsed < step.day) {
      skipped++;
      continue;
    }

    // Don't re-send if already sent this step
    if (sub.lastStep === nextStep) {
      skipped++;
      continue;
    }

    // Resolve subject (can be string or function)
    const subject = typeof step.subject === "function" ? step.subject(sub) : step.subject;
    const text = step.text(sub);

    const ok = await sendEmail(email, subject, text);
    if (ok) {
      await set(`seq:${email}`, {
        ...sub,
        step: nextStep,
        lastStep: nextStep,
        lastSentAt: new Date().toISOString(),
      });
      sent++;
      console.log(`DRIP_SENT | ${email} | ${sub.source} step ${nextStep} | ${subject}`);
    }
  }

  console.log(`DRIP_CRON | active:${emails.length} | sent:${sent} | completed:${completed} | skipped:${skipped}`);
  return res.status(200).json({ processed: emails.length, sent, completed, skipped });
}
