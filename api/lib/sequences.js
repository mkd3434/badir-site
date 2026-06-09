// Email drip sequences for Badir Studio
// Each sequence has steps with: day offset, subject, body generator

const SIGN_OFF = [
  "",
  "Mustafa Kivanc Demirsoy",
  "Founder, Badir Studio",
  "",
  "badir.studio",
  "",
  "---",
  "Reply \"stop\" to unsubscribe.",
].join("\n");

function body(name, lines) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return [greeting, "", ...lines, SIGN_OFF].join("\n");
}

function weakestDims(sub) {
  const dims = sub.meta?.dimensions || {};
  return Object.entries(dims)
    .sort(([, a], [, b]) => (a.score || 0) - (b.score || 0))
    .slice(0, 3)
    .map(([name, d]) => `- ${name}: ${d.score}/${d.max}`)
    .join("\n");
}

// ─────────────────────────────────────────────
// Sequence 1: Trial signup (steps 1-6, step 0 = existing welcome in trial-signup.js)
// ─────────────────────────────────────────────
const trial = [
  {
    day: 1,
    subject: "Your dashboard: 14 intelligence layers explained",
    text: (sub) => body(sub.name, [
      "Your trial is live. Here's what's running on your site right now:",
      "",
      "1. Website & CRO health score",
      "2. Exit page analysis",
      "3. Technical SEO audit (200+ checks)",
      "4. Content gap detection",
      "5. Keyword rank tracking",
      "6. AI search visibility (ChatGPT, Perplexity, Gemini)",
      "7. AI citation monitoring",
      "8. llms.txt optimization",
      "9. Competitor pricing alerts",
      "10. Competitor campaign tracking",
      "11. Brand mention monitoring",
      "12. Review aggregation",
      "13. Weekly PDF intelligence reports",
      "14. Priority-ranked action items",
      "",
      "Most of these run daily. You'll start seeing insights within 24-48 hours.",
      "",
      "Questions? Just reply to this email.",
    ]),
  },
  {
    day: 3,
    subject: "Most businesses miss this one metric",
    text: (sub) => body(sub.name, [
      "Quick question: do you know if ChatGPT mentions your business?",
      "",
      "Most businesses track Google rankings but completely ignore AI search engines. And AI search is where your next customers are looking.",
      "",
      "Here's what we track for you:",
      "- Whether ChatGPT, Perplexity, or Gemini cite your business",
      "- How your content scores for AI readability",
      "- What your competitors look like in AI search results",
      "",
      "This is called GEO — Generative Engine Optimization. It's brand new, and almost nobody is doing it yet.",
      "",
      "Your dashboard already tracks this. Keep an eye on the AI Search layer.",
    ]),
  },
  {
    day: 5,
    subject: "Week 1 — here's what we'd typically find",
    text: (sub) => body(sub.name, [
      "After a few days of monitoring, here's what we usually uncover:",
      "",
      "- 3-5 technical SEO issues dragging down rankings",
      "- 2-3 pages where visitors leave without converting",
      "- At least 1 competitor doing something you should react to",
      "- Content gaps — keywords you should rank for but don't",
      "- Zero AI search presence (most businesses score 0/100 on GEO)",
      "",
      "Have you checked your dashboard yet?",
      "",
      "If not, now's a good time. The insights only get more useful as more data comes in.",
      "",
      "https://badir.studio/offer",
    ]),
  },
  {
    day: 9,
    subject: "What your dashboard has found so far",
    text: (sub) => body(sub.name, [
      "You're over a week into your trial. By now your dashboard has:",
      "",
      "- Daily CRO health scores with trend data",
      "- A full technical SEO audit",
      "- Competitor movements tracked",
      "- Content gap analysis complete",
      "- AI search visibility baseline established",
      "",
      "This is the kind of data most agencies charge $500-2,000/month to provide.",
      "",
      "Your trial runs for 5 more days. Want to talk about what we've found? Reply to this email and I'll walk you through it.",
    ]),
  },
  {
    day: 12,
    subject: "2 days left on your trial",
    text: (sub) => body(sub.name, [
      "Your free trial ends in 2 days.",
      "",
      "When it ends, you'll lose access to:",
      "- Daily monitoring of 14 intelligence layers",
      "- Competitor alerts",
      "- AI search visibility tracking",
      "- Weekly PDF reports",
      "- Priority-ranked action items",
      "",
      "If you've found value in the insights, reply to this email and I'll set you up with a plan that makes sense for your business.",
      "",
      "No pressure — but the data stops flowing on day 14.",
    ]),
  },
  {
    day: 14,
    subject: "Your trial ends today",
    text: (sub) => body(sub.name, [
      "Today's the last day of your free trial.",
      "",
      "If you want to keep your dashboard running, just reply to this email.",
      "",
      "Either way, it's been great having you. The insights we've gathered are yours to keep.",
      "",
      "Bismillah.",
    ]),
  },
];

// ─────────────────────────────────────────────
// Sequence 2: Marketing Health Scorecard (original)
// ─────────────────────────────────────────────
const scorecardMarketing = [
  {
    day: 0,
    subject: (sub) => `Your score: ${sub.meta?.score || "?"}/120 — what to focus on first`,
    text: (sub) => {
      const score = sub.meta?.score || "?";
      const grade = sub.meta?.grade || "Unknown";
      return body(sub.name, [
        `You scored ${score}/120 on the Marketing Health Scorecard. Grade: ${grade}.`,
        "",
        "Your 3 weakest areas:",
        weakestDims(sub) || "- (dimension data not available)",
        "",
        "Here's what I'd focus on first:",
        "",
        "1. Start with your lowest-scoring dimension — that's where the biggest gains are",
        "2. Check if your website passes the 5-second test (can a visitor understand what you do instantly?)",
        "3. Search for your business name in ChatGPT — you might be surprised by what you find (or don't find)",
        "",
        "These three steps alone can shift your marketing trajectory. You don't need to fix everything at once — just start with the area that scored lowest.",
        "",
        "Reply to this email if you want to talk through your results.",
      ]);
    },
  },
  {
    day: 2,
    subject: "Your weakest dimension — and why it matters most",
    text: (sub) => body(sub.name, [
      "Two days ago you took our Marketing Health Scorecard.",
      "",
      "Your weakest dimension is where you're leaving the most on the table. Here's why:",
      "",
      "- Low Website & CRO score = visitors come but don't convert",
      "- Low SEO score = you're invisible on Google",
      "- Low AI Search score = you don't exist in ChatGPT/Perplexity",
      "- Low Competitor Intel = you're always reacting, never leading",
      "- Low Analytics = you're making decisions blind",
      "- Low Brand score = visitors don't trust you enough to buy",
      "",
      "Pick your lowest one. Google \"how to improve [that area]\" and spend 30 minutes reading. That's genuinely the best first step.",
      "",
      "If you want a second opinion on what to prioritize, reply to this email.",
    ]),
  },
  {
    day: 5,
    subject: "Small changes, real results",
    text: (sub) => body(sub.name, [
      "Most businesses that take our scorecard start with a score between 30-60.",
      "",
      "The ones that improve fastest do three things:",
      "- Fix their weakest dimension first (not their strongest)",
      "- Make one change per week instead of trying to fix everything",
      "- Re-assess after 90 days to measure progress",
      "",
      "You already have your baseline. That puts you ahead of most businesses who never measure at all.",
      "",
      "https://badir.studio/scorecard",
      "",
      "Retake the scorecard anytime to track your progress.",
    ]),
  },
  {
    day: 7,
    subject: "One week later — a quick thought",
    text: (sub) => body(sub.name, [
      "One week ago you took our Marketing Health Scorecard.",
      "",
      "If you've made even one change based on your results, you're ahead of 90% of businesses that take assessments and do nothing.",
      "",
      "If you haven't — that's OK too. The scorecard isn't going anywhere. Your results are saved.",
      "",
      "When you're ready to dig deeper, we have 4 other free assessments:",
      "https://badir.studio/assessments",
      "",
      "If you have questions about your score, just reply to this email.",
    ]),
  },
];

// ─────────────────────────────────────────────
// Sequence 3: AI Readiness — SMB
// ─────────────────────────────────────────────
const scorecardAiReadiness = [
  {
    day: 0,
    subject: (sub) => `Your AI readiness: ${sub.meta?.score || "?"}/120 — where to start`,
    text: (sub) => {
      const score = sub.meta?.score || "?";
      const grade = sub.meta?.grade || "Unknown";
      return body(sub.name, [
        `You scored ${score}/120 on the AI Readiness Assessment. Grade: ${grade}.`,
        "",
        "Your 3 weakest areas:",
        weakestDims(sub) || "- (dimension data not available)",
        "",
        "Here's what I'd start with:",
        "",
        "1. Pick ONE area from your weakest dimension — not all of AI, just one specific use case",
        "2. Try a free AI tool for that use case for 2 weeks (ChatGPT, Claude, or Gemini all work)",
        "3. Measure the result: did it save time? Improve quality? Generate something you couldn't before?",
        "",
        "AI readiness isn't about buying software. It's about building the habit of asking \"could AI help with this?\" before starting any task.",
        "",
        "Reply to this email if you want to talk through where to start.",
      ]);
    },
  },
  {
    day: 2,
    subject: "The AI gap most businesses don't see",
    text: (sub) => body(sub.name, [
      "Two days ago you took our AI Readiness Assessment.",
      "",
      "Here's what we see across hundreds of businesses:",
      "",
      "- Most have tried ChatGPT at least once",
      "- Almost none have integrated AI into a daily workflow",
      "- The gap isn't awareness — it's consistency",
      "",
      "The businesses that pull ahead aren't the ones with the most AI tools. They're the ones that use ONE tool, every day, for a specific task.",
      "",
      "Examples:",
      "- A restaurant using AI to rewrite their menu descriptions weekly",
      "- A tradie using AI to draft quotes in 5 minutes instead of 30",
      "- A shop owner using AI to write product descriptions that actually sell",
      "",
      "What's the one task you do every week that AI could help with? Start there.",
    ]),
  },
  {
    day: 5,
    subject: "AI readiness isn't about tools — it's about habits",
    text: (sub) => body(sub.name, [
      "By now you've had a few days to sit with your AI Readiness score.",
      "",
      "Here's a framework that helps:",
      "",
      "Week 1: Pick one repetitive task. Try doing it with AI assistance.",
      "Week 2: Refine the process. Save your best prompts.",
      "Week 3: Measure the time saved or quality gained.",
      "Week 4: Decide if it's worth making permanent.",
      "",
      "That's it. One task. Four weeks. No expensive tools needed.",
      "",
      "The businesses that score highest on AI readiness didn't get there by buying platforms. They got there by building small habits and expanding from there.",
      "",
      "If you're curious which AI tools work best for your industry, reply to this email.",
    ]),
  },
  {
    day: 7,
    subject: "Your AI readiness — one week later",
    text: (sub) => body(sub.name, [
      "One week since you took the AI Readiness Assessment.",
      "",
      "Quick check: have you tried using AI for one task this week?",
      "",
      "If yes — great. The habit is more valuable than the tool.",
      "If not — no judgment. Most people take a few weeks to start.",
      "",
      "When you're ready to explore more, we have other free assessments that might help:",
      "https://badir.studio/assessments",
      "",
      "Or retake the AI Readiness Assessment in 90 days to see your progress:",
      "https://badir.studio/ai-readiness",
      "",
      "Reply anytime if you have questions.",
    ]),
  },
];

// ─────────────────────────────────────────────
// Sequence 4: AI Readiness — Youth
// ─────────────────────────────────────────────
const scorecardAiReadinessYouth = [
  {
    day: 0,
    subject: (sub) => `Your AI readiness: ${sub.meta?.score || "?"}/120 — what it means`,
    text: (sub) => {
      const score = sub.meta?.score || "?";
      const grade = sub.meta?.grade || "Unknown";
      return body(sub.name, [
        `You scored ${score}/120 on the AI Readiness Assessment. Grade: ${grade}.`,
        "",
        "Your 3 areas with the most room to grow:",
        weakestDims(sub) || "- (dimension data not available)",
        "",
        "Here's what this actually means:",
        "",
        "Your score isn't a judgment — it's a starting point. The fact that you took this assessment puts you ahead of most people your age.",
        "",
        "Three things you can do this week:",
        "1. Try using AI for one school or work task (writing, research, brainstorming)",
        "2. Ask AI to explain something you're curious about — go deep on one topic",
        "3. Show someone else what you learned — teaching is the fastest way to learn",
        "",
        "Reply to this email if you want suggestions for free AI tools to start with.",
      ]);
    },
  },
  {
    day: 2,
    subject: "The skill gap no one talks about",
    text: (sub) => body(sub.name, [
      "There's a gap forming right now between people who know how to use AI and people who don't.",
      "",
      "It's not about being a programmer or a tech person. It's about knowing how to:",
      "- Ask AI the right questions (prompt engineering)",
      "- Spot when AI gives you wrong information (critical thinking)",
      "- Use AI to create things that matter (applied creativity)",
      "",
      "These are skills you can learn in weeks, not years. And they'll matter more than most things taught in school right now.",
      "",
      "Start here: take any homework or project you're working on. Before you start, ask ChatGPT or Claude: \"What's the best way to approach this?\" Compare their answer with your instinct. You'll learn something either way.",
    ]),
  },
  {
    day: 5,
    subject: "Builders your age who are already using AI",
    text: (sub) => body(sub.name, [
      "Some things young people are building with AI right now:",
      "",
      "- A 16-year-old who built a revision tool that quizzes them based on their notes",
      "- A university student who uses AI to summarize research papers in seconds",
      "- A young entrepreneur who built an entire website using AI coding tools",
      "- A creative who uses AI to generate art references and mood boards",
      "",
      "None of them are \"tech geniuses.\" They just started experimenting and didn't stop.",
      "",
      "The best time to start building with AI is right now. Not because you need to catch up — but because you have the most time to learn.",
      "",
      "What would you build if AI could help you? Think about it.",
    ]),
  },
  {
    day: 7,
    subject: "Your next step",
    text: (sub) => body(sub.name, [
      "One week since you took the AI Readiness Assessment.",
      "",
      "If you've tried even one new AI tool this week, you're building a skill that most adults are still figuring out.",
      "",
      "Three free resources to keep going:",
      "- ChatGPT (chat.openai.com) — ask it anything, learn by doing",
      "- Claude (claude.ai) — great for writing and research",
      "- Google Gemini (gemini.google.com) — good for visual and creative tasks",
      "",
      "Retake the assessment in a few months to see how far you've come:",
      "https://badir.studio/ai-readiness-youth",
      "",
      "Keep building. Reply anytime if you have questions.",
    ]),
  },
];

// ─────────────────────────────────────────────
// Sequence 5: CRO Audit
// ─────────────────────────────────────────────
const scorecardCroAudit = [
  {
    day: 0,
    subject: (sub) => `Your CRO score: ${sub.meta?.score || "?"}/120 — where you're losing visitors`,
    text: (sub) => {
      const score = sub.meta?.score || "?";
      const grade = sub.meta?.grade || "Unknown";
      return body(sub.name, [
        `You scored ${score}/120 on the CRO Audit. Grade: ${grade}.`,
        "",
        "Your 3 weakest areas:",
        weakestDims(sub) || "- (dimension data not available)",
        "",
        "Here's where to start:",
        "",
        "1. Open your website on your phone right now. Is the main CTA visible without scrolling? If not, that's fix #1",
        "2. Time your homepage load — if it takes more than 3 seconds, you're losing 40% of visitors before they see anything",
        "3. Check your contact form — how many fields? Anything more than 3 is adding friction",
        "",
        "Most conversion problems are visibility problems. People can't click what they can't see, and they won't wait for what doesn't load.",
        "",
        "Reply to this email if you want to talk through your results.",
      ]);
    },
  },
  {
    day: 2,
    subject: "The conversion leak most sites ignore",
    text: (sub) => body(sub.name, [
      "Two days ago you audited your website's conversion health.",
      "",
      "Here's the most common leak we see: trust.",
      "",
      "Visitors land on your site. They're interested. But something stops them from taking action. Usually it's one of these:",
      "",
      "- No testimonials or reviews visible",
      "- No face or name behind the business",
      "- No guarantee or risk-reversal (\"cancel anytime\", \"money-back\")",
      "- The site looks outdated or unfinished",
      "- No social proof (\"50+ customers\", \"trusted by X\")",
      "",
      "You can have the best offer in the world. If visitors don't trust the page, they leave.",
      "",
      "One quick fix: add one real testimonial above or near your main CTA. Even a short quote with a real name makes a measurable difference.",
    ]),
  },
  {
    day: 5,
    subject: "What good conversion actually looks like",
    text: (sub) => body(sub.name, [
      "Here are rough benchmarks for website conversion rates by type:",
      "",
      "- E-commerce product pages: 2-4% is good, 5%+ is excellent",
      "- SaaS free trial pages: 3-7% is good, 10%+ is excellent",
      "- Service business contact forms: 5-10% is good, 15%+ is excellent",
      "- Landing pages (paid traffic): 5-15% is good, 20%+ is excellent",
      "",
      "If you don't know your conversion rate, that's actually useful information. It means the first step is setting up basic analytics (Google Analytics is free).",
      "",
      "Three things that reliably improve conversion on any site:",
      "1. Make your CTA impossible to miss (color contrast, size, position)",
      "2. Remove one form field (every field you remove increases completion)",
      "3. Add one trust signal near the conversion point",
      "",
      "Small changes. Measurable results. That's what CRO is about.",
    ]),
  },
  {
    day: 7,
    subject: "Your CRO audit — one week later",
    text: (sub) => body(sub.name, [
      "One week since you took the CRO Audit.",
      "",
      "If you've made even one change to your website based on the results, you're ahead of most business owners who know they have conversion problems but never fix them.",
      "",
      "If you haven't — open your site on your phone right now. Look at it with fresh eyes. Would you trust this site enough to buy from it? Would you fill out this form?",
      "",
      "That honest 10-second assessment is worth more than any tool.",
      "",
      "Retake the audit anytime to track your progress:",
      "https://badir.studio/cro-audit",
      "",
      "And if you want to check other aspects of your online presence:",
      "https://badir.studio/assessments",
    ]),
  },
];

// ─────────────────────────────────────────────
// Sequence 6: Revert Journey Check-In
// ─────────────────────────────────────────────
const scorecardRevertSurvey = [
  {
    day: 0,
    subject: "Your check-in results — and what they mean",
    text: (sub) => {
      const score = sub.meta?.score || "?";
      return body(sub.name, [
        `Thank you for taking the Revert Journey Check-In. Your score: ${score}/120.`,
        "",
        "The areas where you could use the most support:",
        weakestDims(sub) || "- (dimension data not available)",
        "",
        "First — your score doesn't define your journey. Every revert's path is different. Some dimensions are easier to work on alone, others need community.",
        "",
        "A few things that might help right now:",
        "",
        "1. If community scored low — you're not alone in feeling alone. Finding even one person who understands your journey changes everything",
        "2. If knowledge scored low — start with what's practical (prayer, basic beliefs). You don't need to learn everything at once",
        "3. If family scored low — be patient. Your family is adjusting too. Give them time and keep being kind",
        "",
        "This email is from a real person. If you want to talk, reply and I'll respond personally.",
      ]);
    },
  },
  {
    day: 2,
    subject: "You're not alone in this",
    text: (sub) => body(sub.name, [
      "Two days ago you took the Revert Journey Check-In.",
      "",
      "Something that helps to know: every revert goes through phases. The excitement of early days. The loneliness that can follow. The slow building of a life that makes sense.",
      "",
      "If you're in a difficult phase right now, that's normal. It doesn't mean you made the wrong choice. It means you're in the messy middle where real growth happens.",
      "",
      "A few things that help:",
      "- Find one person (just one) who you can be honest with about your journey",
      "- Don't compare your practice to people who grew up Muslim — your path is different and that's OK",
      "- Learn at your own pace. There's no exam. There's no deadline",
      "",
      "If you need someone to talk to, reply to this email. No judgment, no lectures.",
    ]),
  },
  {
    day: 5,
    subject: "Small steps that make a real difference",
    text: (sub) => body(sub.name, [
      "Here are practical things that reverts tell us helped them the most:",
      "",
      "For community: Attend one community event (even if you sit in the corner). Or join one online group for reverts. Start small.",
      "",
      "For knowledge: Pick ONE topic you're curious about. Learn about it for 10 minutes. That's enough for today.",
      "",
      "For family: Write a short message to someone you love. You don't have to explain Islam. Just maintain the connection.",
      "",
      "For identity: Remember that being Muslim doesn't erase who you were. Your culture, your humor, your experiences — they're still you. Islam adds to your identity; it doesn't replace it.",
      "",
      "For daily life: Find halal versions of things you already enjoy. Halal food, Islamic finance, modest fashion that fits your style. You don't have to give up who you are.",
      "",
      "For spiritual growth: Start with gratitude. Before bed, think of three things you're grateful for. That's worship too.",
    ]),
  },
  {
    day: 7,
    subject: "We're here when you need us",
    text: (sub) => body(sub.name, [
      "One week since your check-in.",
      "",
      "However your week has been — easy or hard, inspiring or lonely — know that your journey matters.",
      "",
      "There's no timeline for where you \"should\" be. There's no checklist you need to complete. There's just today, and whatever small step feels right.",
      "",
      "If you ever want to retake the check-in to see how things have changed:",
      "https://badir.studio/revert-survey",
      "",
      "And if you ever need someone to talk to — not a scholar, not a lecturer, just a person who listens — reply to this email.",
      "",
      "May your journey be filled with peace.",
      "",
      "Bismillah.",
    ]),
  },
];

// ─────────────────────────────────────────────
// Sequence 7: Waitlist signup (steps 1-2, step 0 = existing welcome in waitlist.js)
// ─────────────────────────────────────────────
const waitlist = [
  {
    day: 3,
    subject: "40+ Muslim builder orgs — and what's missing",
    text: (sub) => body(sub.name, [
      "I spent weeks analyzing 40+ Muslim tech organizations worldwide.",
      "",
      "Accelerators, incubators, communities, conferences, funding bodies — the full ecosystem.",
      "",
      "The finding? There's a gap. Nobody combines daily shipping discipline with a faith-rooted community.",
      "",
      "That's what Badir is building.",
      "",
      "Read the full analysis:",
      "https://badir.studio/blog/muslim-builder-ecosystem",
    ]),
  },
  {
    day: 7,
    subject: "How marketing-ready is your project?",
    text: (sub) => body(sub.name, [
      "Whether you're building a SaaS, an e-commerce store, or a service business — your marketing foundation matters.",
      "",
      "Take our 2-minute Marketing Health Scorecard to find out where you stand across 6 dimensions:",
      "",
      "- Website & Conversions",
      "- SEO & Search Visibility",
      "- AI Search (GEO)",
      "- Competitor Intelligence",
      "- Analytics & Data",
      "- Brand & Positioning",
      "",
      "https://badir.studio/scorecard",
      "",
      "It's free, takes 2 minutes, and you'll get personalized recommendations.",
    ]),
  },
];

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────
export const SEQUENCES = {
  trial,
  scorecard: scorecardMarketing,
  waitlist,
  "scorecard-marketing-health": scorecardMarketing,
  "scorecard-ai-readiness": scorecardAiReadiness,
  "scorecard-ai-readiness-youth": scorecardAiReadinessYouth,
  "scorecard-cro-audit": scorecardCroAudit,
  "scorecard-revert-survey": scorecardRevertSurvey,
  // Pain-point survey variants (added 2026-06-07) — reuse existing AI drips for now
  "scorecard-ai-smb-survey": scorecardAiReadiness,
  "scorecard-youth-ai-survey": scorecardAiReadinessYouth,
  "scorecard-builder-readiness": scorecardAiReadiness,
};

export function getSequence(source) {
  if (source === "trial") return trial;
  if (source === "scorecard") return scorecardMarketing;
  if (source === "scorecard-marketing-health") return scorecardMarketing;
  if (source === "scorecard-ai-readiness") return scorecardAiReadiness;
  if (source === "scorecard-ai-readiness-youth") return scorecardAiReadinessYouth;
  if (source === "scorecard-cro-audit") return scorecardCroAudit;
  if (source === "scorecard-revert-survey") return scorecardRevertSurvey;
  // Pain-point survey variants (added 2026-06-07) — reuse existing AI drips for now
  if (source === "scorecard-ai-smb-survey") return scorecardAiReadiness;
  if (source === "scorecard-youth-ai-survey") return scorecardAiReadinessYouth;
  if (source === "scorecard-builder-readiness") return scorecardAiReadiness;
  if (source === "waitlist" || source === "builder-application") return waitlist;
  return null;
}
