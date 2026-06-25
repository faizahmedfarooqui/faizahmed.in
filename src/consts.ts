// Central site configuration. Edit values here, not across components.

// The single canonical host. We consolidated onto the apex domain:
// blog.faizahmed.in/* now 301-redirects to faizahmed.in/* (Cloudflare), so every
// <link rel="canonical">, OG/Twitter URL, JSON-LD URL, sitemap entry, and RSS
// `site` must point at faizahmed.in — NOT the old blog. subdomain.
export const CANONICAL_ORIGIN = "https://faizahmed.in";

// Kept as a separate export for astro.config's `site`; same value now.
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

// Analytics: Cloudflare Web Analytics (cookieless, no personal data, consent-exempt)
// is enabled at the edge in the Cloudflare dashboard — no in-repo script, no GA4.

export const AUTHOR = {
  name: "Faiz Ahmed Farooqui",
  bio: "Software Architect based in Bangalore, India",
  links: [
    { label: "GitHub", url: "https://github.com/faizahmedfarooqui" },
    { label: "LinkedIn", url: "https://linkedin.com/in/faizahmedfarooqui" },
    { label: "Website", url: "https://faizahmed.in" },
    // Self-hosted (no external CDN). Drop the file at public/resume.pdf.
    // `download` makes browsers save it rather than preview inline.
    { label: "Resume", url: "/resume.pdf", download: true },
  ] as { label: string; url: string; download?: boolean }[],
};

// schema.org structured data for the person + site, reused on home/about.
export const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: AUTHOR.name,
  url: `${CANONICAL_ORIGIN}/`,
  jobTitle: "Principal Backend Engineer",
  description: AUTHOR.bio,
  sameAs: AUTHOR.links
    .filter((l) => /github\.com|linkedin\.com/i.test(l.url))
    .map((l) => l.url),
};

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_TITLE,
  url: `${CANONICAL_ORIGIN}/`,
};

// /uses — the toolset. Seeded from the stack referenced across the blog; edit
// freely. Items marked "TODO" are personal specifics only Faiz can fill in.
// `tag` links the item to its /tag/<tag> listing — but only when that tag has
// posts (checked at build via getTags()); otherwise it renders as plain text.
// So set the intended slug even if untagged today; the link lights up later.
export const USES = [
  {
    category: "Languages & runtimes",
    items: [
      { label: "Node.js", tag: "nodejs" },
      { label: "TypeScript", tag: "typescript" },
      { label: "JavaScript", tag: "javascript" },
      { label: "Bash" },
    ],
  },
  {
    category: "Backend & data",
    items: [
      { label: "PostgreSQL", tag: "postgresql" },
      { label: "RabbitMQ", tag: "rabbitmq" },
      { label: "NestJS", tag: "nestjs" },
      { label: "gRPC", tag: "grpc" },
      { label: "REST APIs", tag: "rest-api" },
    ],
  },
  {
    category: "Cloud & infrastructure",
    items: [
      { label: "AWS", tag: "aws" },
      { label: "AWS Lambda", tag: "lambda" },
      { label: "API Gateway", tag: "api-gateway" },
      { label: "OpenStack", tag: "openstack" },
      { label: "Cloudflare Pages", tag: "cloudflare" },
    ],
  },
  {
    category: "Containers & virtualization",
    items: [
      { label: "Docker", tag: "docker" },
      { label: "Docker Compose", tag: "docker" },
      { label: "Traefik", tag: "traefik" },
      { label: "Firecracker", tag: "firecracker" },
      { label: "QEMU", tag: "qemu" },
      { label: "Open vSwitch", tag: "openvswitch" },
    ],
  },
  {
    category: "Observability & delivery",
    items: [
      { label: "OpenTelemetry", tag: "opentelemetry" },
      { label: "Git & GitHub" },
      { label: "GitHub Actions", tag: "github-actions" },
    ],
  },
  {
    category: "Editor & desktop",
    items: [
      { label: "TODO: editor" },
      { label: "TODO: terminal" },
      { label: "TODO: OS / hardware" },
    ],
  },
];

// /about "Core competencies" — same `tag` linking rule as USES. Flat lists per
// group; items without a (matching) tag stay plain text.
export const COMPETENCIES = [
  {
    group: "Backend & APIs",
    items: [
      { label: "Node.js", tag: "nodejs" },
      { label: "TypeScript", tag: "typescript" },
      { label: "PHP" },
      { label: "NestJS", tag: "nestjs" },
      { label: "Express", tag: "express" },
      { label: "GraphQL" },
      { label: "REST" },
    ],
  },
  {
    group: "Cloud & infra",
    items: [
      { label: "AWS", tag: "aws" },
      { label: "Lambda", tag: "lambda" },
      { label: "KMS" },
      { label: "Nitro Enclaves" },
      { label: "OpenStack", tag: "openstack" },
      { label: "Docker", tag: "docker" },
      { label: "GitLab CI/CD" },
      { label: "GitHub Actions", tag: "github-actions" },
    ],
  },
  {
    group: "Databases",
    items: [
      { label: "PostgreSQL", tag: "postgresql" },
      { label: "MySQL" },
      { label: "MongoDB", tag: "mongodb" },
    ],
  },
  {
    group: "Architecture & tooling",
    items: [
      { label: "Microservices", tag: "microservices" },
      { label: "Multi-tenant systems", tag: "multi-tenancy" },
      { label: "OpenTelemetry", tag: "opentelemetry" },
      { label: "API gateways", tag: "api-gateway" },
      { label: "Nginx" },
    ],
  },
  {
    group: "Leadership",
    items: [
      { label: "Team mentorship" },
      { label: "Trunk-based development" },
      { label: "Release-velocity optimization" },
    ],
  },
];

// /now — what Faiz is focused on currently. KEEP THIS FRESH; update `updated`
// whenever it changes (https://nownownow.com/about).
export const NOW = {
  updated: "2026-06-17",
  intro:
    "A snapshot of what I'm working on and thinking about right now.",
  items: [
    "Leading engineering as Lead Software Engineer at Talendy Holdings.",
    "Writing the secret-keystore series on encrypting secrets with AWS KMS in Node.js.",
    "Exploring microVMs (Firecracker, QEMU) and the engineering behind resilient FinTech systems.",
  ],
};

// Series shown in the header nav. `slug` must match the `series:` frontmatter
// value used on posts. Add/remove as the content process labels series.
export const SERIES = [
  {
    title: "AI Engineering",
    slug: "ai-engineering",
    description: "Using AI like an engineer: threat models, secure workflows, and meta-prompting for real production work.",
  },
  {
    title: "Auth & Identity",
    slug: "auth-and-identity",
    description: "How modern authentication actually works: passkeys, WebAuthn, JWT, sessions, and OAuth.",
  },
  {
    title: "Mastering Encryption",
    slug: "encryption",
    description: "Practical cryptography for engineers: AWS KMS, Nitro Enclaves, and keeping secrets safe in production.",
  },
  {
    title: "Metal to Cloud",
    slug: "metal-to-cloud",
    description: "From bare metal and OpenStack to cloud-native infrastructure that scales.",
  },
  {
    title: "Scaling JavaScript & Node.js",
    slug: "scaling-javascript-nodejs",
    description: "Patterns for scaling Node.js: queues, backpressure, idempotency, and production reliability.",
  },
  {
    title: "Virtualization & MicroVMs",
    slug: "vcw",
    description: "QEMU, Firecracker microVMs, and Open vSwitch networking from the ground up.",
  },
  {
    title: "Microservices Design Patterns",
    slug: "microservices-design-patterns",
    description: "Decomposition, data, integration, and operational patterns for microservices.",
  },
  {
    title: "FinTech Engineering",
    slug: "fintech",
    description: "Payments, lending, compliance, and building scalable, resilient financial systems.",
  },
  {
    // NOTE: slug is "treafik" (typo in the original Hashnode series); kept so the
    // existing /series/treafik posts keep resolving. Title is spelled correctly.
    title: "Traefik",
    slug: "treafik",
    description: "Reverse proxy and ingress with Traefik, Docker Compose, and Postgres/pgAdmin.",
  },
];

// Flagship repos to showcase. Star/fork counts are fetched live at build time
// (see src/lib/github.ts); `fallbackStars`/`fallbackForks` are used if the
// GitHub API is unreachable during the build.
export const FEATURED_REPOS = [
  {
    repo: "GeekyAnts/express-typescript",
    blurb: "Production-ready Express + TypeScript boilerplate. My most widely adopted open-source project, used across 20+ production apps.",
    fallbackStars: 1261,
    fallbackForks: 325,
  },
  {
    repo: "faizahmedfarooqui/nodejs",
    blurb: "A low-level Node.js web, API, and CLI app built entirely on Node's core APIs, with zero npm packages.",
    fallbackStars: 21,
    fallbackForks: 1,
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
  { id: "3gAv2ZLio_s", episode: 6, title: "Juju: Orchestration Tool" },
  { id: "cqx1li4xfa4", episode: 7, title: "OpenStack Management" },
  { id: "30vwm5Q3qq8", episode: 8, title: "Infrastructure Components of OpenStack & its Dashboard" },
  { id: "aoMzxKveFP4", episode: 9, title: "Juju Dashboard & Juju Controller" },
];

// Cloudflare Turnstile site key (PUBLIC, safe to commit) for the newsletter
// widget's bot check. Leave "" to disable Turnstile entirely. The matching
// SECRET goes in the TURNSTILE_SECRET_KEY Cloudflare env var (server-side).
// Set both together, then deploy — the /api/subscribe function enforces the
// token only when the secret is present.
export const TURNSTILE_SITE_KEY = "";
