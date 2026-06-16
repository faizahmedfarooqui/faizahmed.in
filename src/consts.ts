// Central site configuration. Edit values here, not across components.

// Canonical host where the SEO-ranked blog URLs already live.
// Every post's <link rel="canonical"> points at CANONICAL_ORIGIN/<slug>.
export const CANONICAL_ORIGIN = "https://blog.faizahmed.in";

// Where the site is also served (primary app domain). Used for the sitemap
// `site` value in astro.config.mjs. Both domains serve the same build.
export const SITE_ORIGIN = "https://faizahmed.in";

export const SITE_TITLE = "Faiz Ahmed Farooqui";
export const SITE_DESCRIPTION = "Software Architect based in Bangalore, India";

// Career start — experience is computed from this, never hardcoded.
export const CAREER_START = new Date("2015-09-01");

// Completed years of experience as of `at` (default now).
export function yearsOfExperience(at: Date = new Date()): number {
  let years = at.getFullYear() - CAREER_START.getFullYear();
  const monthDelta = at.getMonth() - CAREER_START.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && at.getDate() < CAREER_START.getDate())) {
    years -= 1;
  }
  return years;
}

// Google Analytics 4 Measurement ID. (No GTM container exists, so GA4 is wired
// directly — see src/components/Analytics.astro.)
export const GA_MEASUREMENT_ID = "G-3SZKBFTZH7";

export const AUTHOR = {
  name: "Faiz Ahmed Farooqui",
  bio: "Software Architect based in Bangalore, India",
  avatar:
    "https://cdn.hashnode.com/res/hashnode/image/upload/v1639984646889/f69nr3aGZ.png",
  links: [
    { label: "GitHub", url: "https://github.com/faizahmedfarooqui" },
    { label: "LinkedIn", url: "https://linkedin.com/in/faizahmedfarooqui" },
    { label: "Website", url: "https://faizahmed.in" },
  ],
};

// Series shown in the header nav. `slug` must match the `series:` frontmatter
// value used on posts. Add/remove as the content process labels series.
export const SERIES = [
  {
    title: "Mastering Encryption",
    slug: "encryption",
    description: "Practical cryptography for engineers — AWS KMS, Nitro Enclaves, and keeping secrets safe in production.",
  },
  {
    title: "Metal to Cloud",
    slug: "metal-to-cloud",
    description: "From bare metal and OpenStack to cloud-native infrastructure that scales.",
  },
  {
    title: "Scaling JavaScript & Node.js",
    slug: "scaling-javascript-nodejs",
    description: "Patterns for scaling Node.js — queues, backpressure, idempotency, and production reliability.",
  },
];

// Flagship repos to showcase. Star/fork counts are fetched live at build time
// (see src/lib/github.ts); `fallbackStars`/`fallbackForks` are used if the
// GitHub API is unreachable during the build.
export const FEATURED_REPOS = [
  {
    repo: "GeekyAnts/express-typescript",
    blurb: "Production-ready Express + TypeScript boilerplate — my most widely adopted open-source project, used across 20+ production apps.",
    fallbackStars: 1261,
    fallbackForks: 325,
  },
];

// Roles, newest first. `current: true` marks the present position.
export const EXPERIENCE = [
  {
    company: "Talendy Holdings",
    role: "Lead Software Engineer",
    period: "Jun 2026 – Present",
    url: "https://www.talendy.world/",
    current: true,
  },
  {
    company: "GeekyAnts",
    role: "Principal Engineer / Architect",
    period: "Sep 2015 – May 2026",
    url: "https://geekyants.com",
    current: false,
  },
];

// Bolt.SH walkthrough series (the internal OpenStack data center I built at
// GeekyAnts), newest-relevant first. Rendered click-to-play on /bolt.
export const BOLT_VIDEOS = [
  { id: "IUEw5PV4VBs", episode: 2, title: "Autoprovision of Servers" },
  { id: "ncRzMFRln-8", episode: 5, title: "Leveraging Zabbix" },
  { id: "3gAv2ZLio_s", episode: 6, title: "Juju — Orchestration Tool" },
  { id: "cqx1li4xfa4", episode: 7, title: "OpenStack Management" },
  { id: "30vwm5Q3qq8", episode: 8, title: "Infrastructure Components of OpenStack & its Dashboard" },
  { id: "aoMzxKveFP4", episode: 9, title: "Juju Dashboard & Juju Controller" },
];
