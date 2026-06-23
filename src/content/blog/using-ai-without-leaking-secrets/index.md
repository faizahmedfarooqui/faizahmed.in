---
title: "Using AI Without Leaking Your Secrets: A Threat Model for AI-Assisted Development"
datePublished: 2026-06-23 10:00:00 GMT+0000 (Coordinated Universal Time)
slug: using-ai-without-leaking-secrets
tags: ai, security, nodejs, aws, secrets
series: ai-engineering
---

Someone hits an error, copies the whole stack trace into a chat window, and asks the
model to "just figure this out fast." Buried three lines into that trace is a
`DATABASE_URL` with a live password in it. The answer comes back in four seconds. The
secret is now somewhere you can't reach.

Pasting secrets into an LLM prompt is the new paste-to-Pastebin, except you can't
delete it from a request log or a training set after the fact. This post is not about
avoiding AI. I use it every day to ship code. It's about using it the way you'd use any
system that crosses a trust boundary: with a threat model, not a vibe.

## Where your prompt actually goes

Most people picture a prompt as a private conversation. It isn't. It's an outbound
request that fans out into several places, and which places depend entirely on what
you're paying for.

On free and consumer tiers, your inputs are often retained and may be used to improve
the model. On paid Pro, Team, and Enterprise tiers, the provider typically contracts
*not* to train on your data and to keep shorter or zero retention windows. That
distinction is real, and it matters: paid seats are genuinely safer. But "not trained
on" is not the same as "never stored." Request logs, abuse-detection systems,
human-review exceptions, and sub-processors all still exist.

```mermaid
flowchart LR
  subgraph trusted["Your trust boundary"]
    dev[You + editor]
    repo[(Repo · .env · keys)]
  end
  subgraph provider["AI provider, trusted but unverifiable"]
    api[Inference API]
    logs[(Request logs / retention)]
    train{{Training pipeline?}}
  end
  repo -. auto-attached context .-> dev
  dev -- prompt + context --> api
  api --> logs
  logs -. policy-dependent .-> train
  api -- completion --> dev
```

There are three ways data leaks across that boundary, and only the first is obvious:

1. **What you paste**, like the stack trace, the config, the snippet.
2. **What the tool auto-attaches**, including open files, the surrounding repo, and
   terminal output. Modern coding assistants pull in context you never explicitly
   handed them.
3. **What the model emits**, such as a secret you fed in earlier, echoed back into a
   commit, a PR description, or a log line.

## The threat model

Here's the framing that keeps this honest: the provider is not an *adversary*. They're
a *trusted-but-unverifiable third party*. The risk isn't that they're lying about
training. It's that you can't audit their internal pipeline, and policies,
sub-processors, and breach exposure all change over time.

- **Assets at risk:** API keys and tokens, database connection strings, private keys
  and certificates, customer PII sitting in test fixtures, and proprietary business
  logic.
- **Failure modes:** provider retention beyond what you assumed, an over-broad tool
  context window, a compromised editor extension, or your own future self pasting the
  model's output somewhere public.

Treat the prompt channel the way you'd treat any outbound network call from
production: as untrusted egress. You wouldn't ship plaintext customer data to a
third-party endpoint just because their docs promised they'd be careful with it. The
prompt box is that endpoint.

## What never goes in a prompt

A short do-not-send list does most of the work:

- Live credentials, tokens, or API keys
- The contents of `.env`, `.env.local`, `.env.production`
- Private keys, certificates, or key material
- Real customer PII such as names, emails, or payment data
- Full dumps of proprietary source you wouldn't open-source

The important nuance is that this is about *masking*, not abstinence. Placeholders are
completely fine, and the model reasons about them just as well:
`[API_KEY]`, `[DB_PASSWORD]`, `postgres://user:****@host/db`. You almost never need
the real value to get the real answer. If you already have a
[secrets-sprawl problem](/secrets-sprawl-in-nodejs-projects-detection-prevention-and-secure-deployment-2025),
AI assistance just adds one more exfiltration path on top of it.

## Context hygiene: make leaks structurally impossible

Relying on "remember to be careful" fails the first time you're tired. Build the
discipline into the workflow instead, as a loop that runs before anything leaves your
machine.

```mermaid
flowchart LR
  a[Draft prompt] --> b{Secret scan}
  b -- secret found --> stop[/Redact/] --> b
  b -- clean --> d[Mask to placeholders] --> e[Send to AI]
```

Three concrete habits carry it:

- **An ignore file for AI tools**, which is the AI-era `.gitignore`. Keep `.env`,
  secrets directories, and key material out of the context your assistant
  auto-attaches.
- **Scan before you send.** Run secret detection as a pre-prompt habit, not only at
  pre-commit. The cheapest leak to fix is the one that never left the editor.
- **Keep plaintext from existing at all.** This is where the deeper principle lives. If
  secrets are stored as ciphertext and only decrypted into memory at runtime, there is
  no pasteable plaintext to leak in the first place. That's exactly what
  [envelope encryption](/what-is-envelope-encryption) and a
  [KMS-backed secrets threat model](/nodejs-secrets-threat-model-aws-kms) buy you, and
  it's why I [keep encrypted env files out of the codebase entirely](/encrypted-env-aws-kms-nodejs-complete-guide).

## Cloud vs paid tier vs local: picking the right home for the data

The honest answer isn't "self-host everything," which throws away most of the value.
It's matching the tier to the sensitivity of what you're sending.

| Tier | No-training guarantee | Verifiable? | Use it for |
| --- | --- | --- | --- |
| Free / consumer chat | Often no, may train | No | Throwaway snippets, public docs |
| Paid Pro / Team / Enterprise (with DPA) | Yes, contractually | Contractually, not technically | Most proprietary engineering work |
| Local / self-hosted model | Not applicable, never leaves | Yes, by construction | Regulated data you must *prove* stayed home |

And the decision, as a flow:

```mermaid
flowchart TD
  start([About to send code/data]) --> q1{Secrets or PII?}
  q1 -- No, throwaway --> free[Any tier · incl. free]
  q1 -- Yes --> q2{Regulated?<br/>PCI · HIPAA}
  q2 -- No --> paid[Paid tier w/ no-training DPA]
  q2 -- Yes --> q3{Must prove it never left?}
  q3 -- No --> paid
  q3 -- Yes --> local[Local / self-hosted]
```

For most real engineering work, a paid tier with a no-training agreement is the
pragmatic default. Say it plainly, because it's true. You step down to local or
self-hosted models only when the data is regulated and you need to *prove* it never
transited a third party, not merely be promised so. Payment data under PCI, health
data under HIPAA: that should never touch a consumer chat tier, full stop.

## Zero-trust, applied to AI

This is the part that ties it together. We use the paid tiers. We trust the no-training
promise enough to do real work on them. And we *still* don't paste the crown jewels.
Not because we think the provider is lying, but because the cheapest secret to protect
is the one that never left the machine.

A no-training guarantee is a *contractual* control, not a *technical* one. It lowers
risk; it doesn't eliminate it. So we treat it as one layer and assume the prompt
channel could be hostile anyway, the same
[zero-trust posture](/zero-trust-encryption-a-security-first-approach) you'd apply to
any boundary: verify, scope, minimize. Least-context, not just least-privilege. This
isn't distrust. It's the same reason you encrypt data at rest even though your cloud
provider already promised the disks are safe. Play nice, play safe, defense in depth.

## The checklist

Before AI touches your code:

1. Add an AI-tool ignore file; exclude `.env`, secrets directories, and key material
   from auto-attached context.
2. Run a secret scan on anything you're about to paste.
3. Mask credentials and PII with placeholders, never live values.
4. Use a paid tier with a no-training agreement for proprietary work; reserve
   local/self-hosted for regulated data you must prove never left.
5. Keep real secrets in a KMS or keystore so plaintext never exists to paste.
6. Review the AI's *output* before it lands in logs, PRs, or commits. Models echo back
   what you fed them.
7. Treat the prompt channel as untrusted egress: log and minimize what crosses it.

None of this slows you down once it's a habit. The four-second answer is still four
seconds. It just doesn't cost you a secret you can never take back.
