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

// Sequence 1: Trial signup (steps 1-6, step 0 = existing welcome in trial-signup.js)
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

// Sequence 2: Scorecard completion (steps 0-3, all new — no existing welcome)
const scorecard = [
  {
    day: 0,
    subject: (sub) => `Your score: ${sub.meta?.score || "?"}/120 — what to fix first`,
    text: (sub) => {
      const score = sub.meta?.score || "?";
      const grade = sub.meta?.grade || "Unknown";
      const dims = sub.meta?.dimensions || {};
      const weakest = Object.entries(dims)
        .sort(([, a], [, b]) => (a.score || 0) - (b.score || 0))
        .slice(0, 3)
        .map(([name, d]) => `- ${name}: ${d.score}/${d.max}`)
        .join("\n");

      return body(sub.name, [
        `You scored ${score}/120 on the Marketing Health Scorecard. Grade: ${grade}.`,
        "",
        "Your 3 weakest areas:",
        weakest || "- (dimension data not available)",
        "",
        "Here's what I'd fix first:",
        "",
        "1. Start with your lowest-scoring dimension — that's where the biggest gains are",
        "2. Check if your website passes the 5-second test (can a visitor understand what you do instantly?)",
        "3. Search for your business name in ChatGPT — you might be surprised by what you find (or don't find)",
        "",
        "Want to see exactly what's happening with your marketing? We run 14 intelligence layers on your site — free for 14 days:",
        "",
        "https://badir.studio/offer",
      ]);
    },
  },
  {
    day: 2,
    subject: "Your weakest area is costing you",
    text: (sub) => body(sub.name, [
      "Two days ago you took our Marketing Health Scorecard.",
      "",
      "Your weakest dimension is where you're leaving the most money on the table. Here's why:",
      "",
      "- Low Website & CRO score = visitors come but don't convert",
      "- Low SEO score = you're invisible on Google",
      "- Low AI Search score = you don't exist in ChatGPT/Perplexity",
      "- Low Competitor Intel = you're always reacting, never leading",
      "- Low Analytics = you're making decisions blind",
      "- Low Brand score = visitors don't trust you enough to buy",
      "",
      "Each of these has a specific fix. And our 14-layer dashboard monitors all of them daily.",
      "",
      "https://badir.studio/offer",
    ]),
  },
  {
    day: 5,
    subject: "From Flying Blind to Marketing Leader — it's possible",
    text: (sub) => body(sub.name, [
      "Most businesses we work with start with a score between 30-60 on our scorecard.",
      "",
      "Within 90 days, they typically:",
      "- Fix 80% of their technical SEO issues",
      "- Increase website conversions by 15-30%",
      "- Get cited by at least 1 AI search engine",
      "- Know exactly what their competitors are doing",
      "- Make marketing decisions based on data, not guesswork",
      "",
      "The difference? Having the right data in front of you every day.",
      "",
      "That's what our dashboard does. 14 intelligence layers, running 24/7, for less than what most businesses spend on a single ad campaign.",
      "",
      "See it in action — free for 14 days:",
      "https://badir.studio/offer",
    ]),
  },
  {
    day: 7,
    subject: "See all 14 layers working on YOUR site — free",
    text: (sub) => body(sub.name, [
      "One week ago you took our Marketing Health Scorecard.",
      "",
      "The scorecard gives you a snapshot. Our dashboard gives you the full picture — updated daily.",
      "",
      "14 intelligence layers. 14 days free. No credit card.",
      "",
      "https://badir.studio/offer",
      "",
      "If you have questions about your score or what we do, just reply to this email.",
    ]),
  },
];

// Sequence 3: Waitlist signup (steps 1-2, step 0 = existing welcome in waitlist.js)
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

export const SEQUENCES = { trial, scorecard, waitlist };

export function getSequence(source) {
  if (source === "trial") return trial;
  if (source === "scorecard") return scorecard;
  if (source === "waitlist" || source === "builder-application") return waitlist;
  return null;
}
