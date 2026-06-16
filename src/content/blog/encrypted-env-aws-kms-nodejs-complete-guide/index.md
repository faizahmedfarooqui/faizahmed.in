---
title: "Encrypted .env for Node.js with AWS KMS: The Complete Guide"
datePublished: Fri Jun 12 2026 11:24:08 GMT+0000 (Coordinated Universal Time)
cuid: cmqau9l27000004l72ugd63vg
slug: encrypted-env-aws-kms-nodejs-complete-guide
cover: ./cover.jpg
tags: security, aws, nodejs, devops, backend
series: encryption

---

A year ago I would have told you a `.env` file was fine. Then we patched a CVSS 10.0 RCE in Next.js ([CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478)) and spent the next two days rotating *every* secret we owned — because we couldn't prove which ones an attacker could have read. They were all sitting in `process.env`. One `env` dump away from gone.

I wrote about that incident and the first version of the fix in [**Stop Putting Secrets in process.env**](https://blog.faizahmed.in/secret-keystore). This guide is the follow-up: the package grew up. It now has a real CLI, a zero-config runtime loader, key rotation, and a test suite that runs on every commit. This is the complete, current picture of `@faizahmed/secret-keystore` — and a map to the deep-dives.

> **The one idea:** the only thing a developer ever touches is a **KMS Key ID** — which is *not* a secret. No private keys, no passphrases, no key material to leak. AWS KMS holds the keys server-side and gates them with IAM. Decrypted values live **only in memory**, never in `process.env`, never on disk. So the blast radius of the next RCE is a handful of keys your code explicitly asked for — not the whole vault.

## The 30-second version

```shell
npm install @faizahmed/secret-keystore

# 1. Encrypt the secrets in your .env (in place)
npx @faizahmed/secret-keystore encrypt --kms-key-id="alias/my-key"

# 2a. Run your app with secrets injected — no code change
npx @faizahmed/secret-keystore run --kms-key-id="alias/my-key" -- node server.js
```

```javascript
// 2b. ...or load them in-process, 
// where they never touch process.env
const { config } = require('@faizahmed/secret-keystore');

const secrets = await config({ 
  kmsKeyId: 'alias/my-key'
});

const dbPassword = secrets.get('DB_PASSWORD'); // decrypted, in memory only
```

Your committed `.env` now looks like this — useless to anyone without your KMS key and IAM permissions:

```shell
DB_PASSWORD=ENC[AQICAHh2nZPq...]
API_KEY=ENC[AQICAHh2nZPq...]
```

## What's in this series

This is a **pillar + cluster**. Start wherever your question lives:

*   [**Part 1 — Your .env Is a Loaded Gun**](https://blog.faizahmed.in/nodejs-secrets-threat-model-aws-kms): the threat model. Why `process.env` is the problem, what "blast radius" actually means, how KMS envelope encryption works for symmetric *and* RSA keys, and where `dotenv`, `dotenvx`, SOPS, and Secrets Manager fit. *Read this if you want the "why."*
    
*   [**Part 2 — Encrypt Your .env with One Command**](https://blog.faizahmed.in/secret-keystore-cli-encrypt-env-aws-kms): the CLI. Create a KMS key, scope an IAM policy, then `encrypt`, `decrypt`, `rotate`, `edit`, `init`, `keys`, `status`, `import`, and `run` — every command, copy-paste ready. *Read this if you want to ship today.*
    
*   [**Part 3 — Loading Secrets Without Leaking Them**](https://blog.faizahmed.in/secret-keystore-runtime-config-loader-nodejs): the runtime. The `config()` loader and the `SecretKeyStore` API, the `run` command, TTL and caching for Lambda cold starts, Docker, rotating keys in production, and Nitro Enclave attestation. *Read this for production.*
    

## What it is — and isn't

**It is** a Node.js library + CLI that encrypts the values in your `.env`, JSON, or YAML config with AWS KMS, and decrypts them on demand into an access-controlled, in-memory store. Same KMS you already trust; a different *consumption model*— file-based, encrypted-at-rest config you can commit to a private repo, with minimal infra changes.

**It is not** a silver bullet. An attacker with full code execution *inside your process* can still call the keystore or scrape memory. What this kills is **bulk exposure**: there's no single `process.env` dump that hands over every secret, no accidental log line that leaks them, no plaintext in your git history. Access is per-key and explicit — `grep` for `.get(` and you have an audit.

If you've already standardized on AWS Secrets Manager or SSM Parameter Store, keep using them. This is for teams who want **encrypted config files** while keeping their existing env/config workflow.

## Who should read on

*   **Backend / full-stack devs** who use `.env` today → Part 2, then Part 3.
    
*   **DevOps / platform engineers** running KMS, IAM, CI/CD, containers → Part 2 (IAM, rotation) and Part 3 (Docker/Lambda).
    
*   **Security-minded engineers** → Part 1, then the threat-model and attestation sections of Part 3.
    

## Where it lives

*   **npm:** [`@faizahmed/secret-keystore`](https://www.npmjs.com/package/@faizahmed/secret-keystore)
    
*   **GitHub (+ runnable Next.js & NestJS examples):** [faizahmedfarooqui/secret-keystore](https://github.com/faizahmedfarooqui/secret-keystore)
    
*   **The origin story:** [Stop Putting Secrets in process.env](https://blog.faizahmed.in/secret-keystore)
    

Next: [**Part 1 — Your .env Is a Loaded Gun →**](https://blog.faizahmed.in/nodejs-secrets-threat-model-aws-kms)
