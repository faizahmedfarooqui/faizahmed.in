---
title: "Stop Putting Secrets in process.env: Encrypt Env Vars with AWS KMS"
datePublished: Sat Feb 21 2026 19:30:57 GMT+0000 (Coordinated Universal Time)
cuid: cmlwps3ab010a28iwa9r49bq4
slug: secret-keystore
cover: ./cover.jpg
tags: security, aws, attestation, nodejs, nextjs, nestjs, devops, cloud, backend
series: null

---

This post starts with the production problem we hit in late 2025, the [critical security vulnerability in React Server Components and Next.js](https://nextjs.org/blog/CVE-2025-66478) (CVE-2025-66478). Then it explains the library I built in response: **@faizahmedfarooqui/secret-keystore**: encrypt `.env`, JSON, and YAML with AWS KMS, reduce blast radius, and make secret access explicit and scoped. Includes threat model, what this actually improves (and what it doesn’t), plus ready-to-run Next.js and NestJS examples.

## The production problem: CVE-2025-66478

In **November 2025**, we patched a **CVSS 10.0 RCE** in Next.js. Then came the worst part: rotating every secret in the system, because we couldn’t prove which ones had been exposed.

The vulnerability was in the [React Server Components (RSC) protocol and Next.js App Router](https://nextjs.org/blog/CVE-2025-66478): [CVE-2025-66478](https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp) allowed **remote code execution** when processing attacker-controlled requests in unpatched Next.js 15.x, 16.x, and certain 14.x canary builds. Next.js patched quickly and [recommended rotating all application secrets](https://nextjs.org/blog/CVE-2025-66478#rotating-environment-variables) once you’d upgraded and redeployed.

That’s the right response, but it forced a hard question: **how many of our secrets were even in scope?**

If every credential lives in `process.env` or in plaintext config files, then in the window when an app was unpatched and exposed, an attacker with RCE could have read all of them.

You’re left rotating *everything* and hoping nothing was exfiltrated. There’s no way to say “only these keys were ever decrypted in a constrained path.”

During the patch-and-rotate scramble, we realized we couldn’t even confidently answer *which* secrets had been in memory. Everything was in `process.env`.

That was the wake-up call. That incident is exactly what pushed me to stop treating env vars as “good enough” and to build something that keeps secrets out of the default blast radius.

## What I built: secret-keystore

**secret-keystore** is a Node.js library that:

*   **Encrypts secrets at rest**: Values in `.env`, JSON, or YAML are stored as `ENC[...]` ciphertext using **AWS KMS**. Without the key and IAM permissions, the config file is useless.
    
*   **Does not auto-load into global runtime state**: At runtime, plaintext lives only inside a small **in-memory keystore** you access via `keyStore.get('KEY')`. `process.env` still holds the encrypted string. Only code paths that explicitly request a key trigger decryption; you can limit which keys are ever decrypted.
    
*   **Makes secret access explicit and scoped**: This does **not** make RCE harmless. An attacker with code execution could still import the keystore, call `keyStore.get()`, dump memory, or hook into the decryption flow. What it does is **reduce bulk exposure**: no single dump of `process.env` with every secret, and secret access is explicit and scoped, because you choose which keys are decryptable and which code paths call them. At minimum that’s auditable by code search (e.g. grep for `keyStore.get`); optionally you can log or trace key access points without logging values.
    

So for incidents like [CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478): you still patch and rotate. But you have a clearer story: secrets weren’t sitting in `process.env` by default; they were decrypted on demand in a controlled layer. That’s the production problem we faced, and that’s why I built this. We’ve since rolled this pattern across multiple services in production.

You also get:

*   **Server-side only**: Designed for Node backends, API routes, Server Components, and Lambdas. Not for browser or `NEXT_PUBLIC_*` (the docs explain why).
    
*   **Optional hardening**: TTL, auto-refresh, in-memory encryption of the keystore, and optional Nitro Enclave attestation for high-security environments.
    

**Before vs after** (bulk exposure at a glance):

```plaintext
Before:  App startup → process.env (all secrets decrypted, loaded into global state)
         One RCE or dump = every secret exposed.

After:   process.env holds ENC[...] only.
         App → keyStore.get("KEY") → KMS decrypt on demand → plaintext in keystore only.
         No bulk dump of process.env; access is per-key and explicit.
```

## What this actually improves

Spelled out:

*   **No bulk secret dump via** `process.env`: An attacker or bug that reads `process.env` only sees ciphertext (and non-secret config). Plaintext is only in the keystore, and only for keys your code has requested.
    
*   **Reduced accidental logging**: Logging `process.env` or a generic config dump doesn’t leak decrypted secrets.
    
*   **Reduced accidental client bundling**: Anything that accidentally exposes env values to the client only ever sees `ENC[...]` ciphertext, not plaintext.
    
*   **Easier key rotation**: Re-encrypt with a new KMS key or new values and redeploy; no need to hunt for every place that might have cached `process.env`.
    
*   **Explicit secret access boundaries**: You see exactly which modules call `keyStore.get('KEY')` (easy to audit in code; optionally trace key access without values).
    

## Threat model

**This protects against:**

*   Accidental exposure (e.g. logging, error reports, config dumps).
    
*   Source control leaks (committed config holds ciphertext; without KMS access it’s useless).
    
*   Some RCE blast radius (no single `process.env` dump with all secrets; access is per-key and explicit).
    

**This does not protect against:**

*   Full system compromise (attacker can still use your IAM role, call KMS, or read memory).
    
*   IAM role or credential compromise (whoever can decrypt with your key can get plaintext).
    
*   Memory scraping or post-decryption attacks (once a secret is in memory, it can be read by something with the same process or a memory dump).
    

Being explicit about this keeps the post credible and security-aware.

## Costs & tradeoffs

*   **KMS decrypt adds latency**: Especially on Lambda cold start; use TTL/caching so you’re not re-decrypting on every request (see [SECURITY.md](http://SECURITY.md) and the README).
    
*   **KMS has per-request cost**: Cache decrypted values with TTL; avoid hitting KMS on every `keyStore.get()`.
    
*   **IAM must be scoped**: Least privilege: grant only the decrypt permission needed for the key(s) you use (see minimal policy below).
    
*   **Secrets exist in memory after access**: Covered in the threat model; no protection against memory scraping once decrypted.
    

### Minimal IAM policy (least privilege)

Restrict to a single KMS key and only decrypt. Full policy document (copy-paste ready):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDecryptForSecretKeystore",
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:us-east-1:YOUR_ACCOUNT:key/YOUR_KEY_ID"
    }
  ]
}
```

Add `kms:DescribeKey` only if your flow needs it. Tighten further with conditions (e.g. encryption context) if your deployment supports it; at minimum scope by key ARN.

**Why not just use AWS Secrets Manager or SSM Parameter Store?** If you’re already standardized on Secrets Manager or SSM, use that. secret-keystore is for teams that want encrypted config files while keeping existing env/config workflows. Same KMS, different consumption model: file-based, encrypted-at-rest `.env` (or JSON/YAML) in git, minimal infra changes.

**When this pattern fits best**

*   Apps with file-based env/config workflows that still want encrypted-at-rest config.
    
*   Teams on AWS who can rely on IAM roles (ECS, EC2, Lambda).
    
*   Teams who want to reduce bulk secret exposure without migrating to a managed secret store.
    

Below is how to use it and where the Next.js and NestJS examples live.

## How to use it (three steps)

### 1\. Install and prepare config

```shell
npm install @faizahmedfarooqui/secret-keystore
```

Use a normal `.env` (or JSON/YAML) with your secrets in plaintext at first. You’ll encrypt them in the next step.

```shell
KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/your-key-id
AWS_REGION=us-east-1

DB_PASSWORD=mysecretpassword
API_KEY=sk-1234567890abcdef
JWT_SECRET=super-secret-jwt-key
```

`KMS_KEY_ID` and `AWS_REGION` stay in plaintext (needed for decryption). They aren’t secrets, but treat them as configuration you still don’t want to leak unnecessarily. Everything else can be encrypted.

### 2\. Encrypt secrets with the CLI

Run the CLI once (e.g. locally or in CI) to turn chosen keys into KMS ciphertext. The file is updated in place.

```bash
npx @faizahmedfarooqui/secret-keystore encrypt \
  --kms-key-id="arn:aws:kms:us-east-1:123456789012:key/your-key-id" \
  --keys="DB_PASSWORD,API_KEY,JWT_SECRET"
```

After this, your file looks like:

```env
DB_PASSWORD=ENC[AQICAHh2nZPq...]
API_KEY=ENC[AQICAHh2nZPq...]
JWT_SECRET=ENC[AQICAHh2nZPq...]
```

You can commit this file if your repo is private and access is controlled; without the KMS key and IAM permissions, the ciphertext is useless.

### 3\. Use the keystore at runtime

In your server code, read the config, create the keystore with the same KMS key, and read secrets via `keyStore.get(...)`. In production, the encrypted config can come from a file baked into the image, an attached volume, S3, or your CI artifact; anything that can safely store ciphertext.

```javascript
const { createSecretKeyStore } = require('@faizahmedfarooqui/secret-keystore');
const fs = require('node:fs');

async function bootstrap() {
  const content = fs.readFileSync('./.env', 'utf-8');
  const kmsKeyId = process.env.KMS_KEY_ID;

  const keyStore = await createSecretKeyStore(
    { type: 'env', content },
    kmsKeyId,
    {
      paths: ['DB_PASSWORD', 'API_KEY', 'JWT_SECRET'],
      aws: { region: process.env.AWS_REGION }
    }
  );

  const dbPassword = keyStore.get('DB_PASSWORD');  // plaintext only here
  const apiKey = keyStore.get('API_KEY');

  // process.env.DB_PASSWORD is still ENC[...]; safe to log
  connectToDatabase({ password: dbPassword });
}

bootstrap();
```

By default the library uses the IAM role of the process (e.g. EC2, ECS, Lambda). For local dev you can pass explicit credentials or use `--use-credentials` with the CLI. Where the encrypted file lives (container image, volume, S3, etc.) is up to your deployment; the library just needs the ciphertext string.

## Two full examples: Next.js and NestJS

The repo includes two runnable examples so you can see patterns that work and ones that don’t.

### Next.js (App Router)

*   **Location:** `examples/nextjs` in the [GitHub repo](https://github.com/faizahmedfarooqui/secret-keystore).
    
*   **What it shows:** A shared keystore created once and used in API routes and Server Components. Secrets are never passed to Client Components or `NEXT_PUBLIC_*`.
    
*   **Highlights:**
    
    *   Keystore is created in a small `lib/keystore` module and reused.
        
    *   API route `app/api/secrets/[key]/route.ts` returns a secret by key (for demo only). In real apps, don’t build a “get secret by key” endpoint: use the keystore inside server-side logic only.
        
    *   A Server Component (no `"use client"`) can call `getSecret(...)`; a Client Component cannot and must get data via API or server-rendered props.
        
*   **Run it:** Copy `.env.example` to `.env.local`, set `KMS_KEY_ID`, run `npm run encrypt:keys`, then `npm run dev`. See the example README for details.
    

### NestJS

*   **Location:** `examples/nestjs` in the [GitHub repo](https://github.com/faizahmedfarooqui/secret-keystore).
    
*   **What it shows:** A global `KeyStoreModule` that builds the keystore at startup and injects it into services. Controllers and services use the same keystore instance.
    
*   **Highlights:**
    
    *   `KeystoreModule` reads config, calls `createSecretKeyStore`, and exposes the keystore via a custom provider.
        
    *   A `SecretsController` (or any service) injects the keystore and calls `.get('KEY')` when it needs a secret.
        
    *   Fits standard NestJS patterns: one module, one place to configure KMS and paths, then inject wherever you need secrets.
        
*   **Run it:** Same idea: `.env` from `.env.example`, set `KMS_KEY_ID`, run the encrypt script, then `npm run start:dev`. See the example README for step-by-step commands.
    

Both examples use the same package and the same three-step flow: install → encrypt with CLI → use `createSecretKeyStore` and `keyStore.get()` in server code.

## What to keep in mind

*   **Server-side only.** The library relies on AWS KMS and Node.js. It does **not** work in the browser, in Client Components, or for `NEXT_PUBLIC_*` (those are baked into client JS at build time). The README has a clear “works with / doesn’t work with” section and small code snippets for Next.js.
    
*   **KMS key required.** Every encrypt/decrypt path needs a KMS key ID (ARN, alias, or key id). The library doesn’t read it from the file; you pass it in (e.g. via env or config).
    
*   **Formats.** You can encrypt keys in `.env`, JSON, or YAML. For YAML you can use glob patterns like `**.password` to target nested keys. Optional dependency `js-yaml` improves YAML support.
    
*   **Production tuning.** For Lambda, cold starts add KMS decrypt latency; the README and [SECURITY.md](http://SECURITY.md) cover caching, TTL, and rate limits. Use TTL and auto-refresh where appropriate so you’re not re-decrypting on every request.
    

## Where to go from here

*   **Package on npm:** [@faizahmedfarooqui/secret-keystore](https://www.npmjs.com/package/@faizahmedfarooqui/secret-keystore)
    
*   **Repo and examples:** [faizahmedfarooqui/secret-keystore](https://github.com/faizahmedfarooqui/secret-keystore): clone it and run `examples/nextjs` or `examples/nestjs` for a full walkthrough.
    
*   **Security and options:** The main README and [SECURITY.md](http://SECURITY.md) in the repo cover threat model, IAM, optional in-memory encryption, TTL/caching (including Lambda cold start considerations), and Nitro Enclave attestation.
    

If you’re building a Next.js or NestJS app on AWS and want env-based secrets that stay encrypted at rest and out of `process.env` at runtime, **secret-keystore** and the two examples are a good place to start.
