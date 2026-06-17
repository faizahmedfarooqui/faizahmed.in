---
title: "Your .env Is a Loaded Gun: A Saner Threat Model for Node.js Secrets"
datePublished: Fri Jun 12 2026 11:31:09 GMT+0000 (Coordinated Universal Time)
cuid: cmqauim6l000104i8chx4ddxo
slug: nodejs-secrets-threat-model-aws-kms
cover: ./cover.jpg
tags: security, aws, nodejs, backend, devops
series: encryption

---

> **Part 1 of 3** in a deep-dive on [`@faizahmed/secret-keystore`](https://www.npmjs.com/package/@faizahmed/secret-keystore). New here? Start with the [Complete Guide](/encrypted-env-aws-kms-nodejs-complete-guide). For the original incident write-up, see [Stop Putting Secrets in process.env](/secret-keystore).

Most "secrets management" advice stops at *don't commit your* `.env`. That's table stakes, and it's not the part that hurts you. The part that hurts you is what happens **the moment your process is compromised**.

Let me make it concrete.

## The blast radius problem

Here's the default Node.js setup, the one in 90% of repos:

```javascript
require('dotenv').config(); 
// every secret → process.env, at startup
```

Now an attacker gets code execution — a dependency RCE, an SSRF that reaches an internal eval, a deserialization bug, [a CVSS 10.0 in your framework](https://nextjs.org/blog/CVE-2025-66478). Their first move is almost always the same:

```shell
env

# or, in-process:
JSON.stringify(process.env)
```

One line. Every database password, API key, JWT secret, and webhook token you own, in plaintext, in one place. That's your **blast radius**: everything reachable from a single, trivial action.

And then comes the part nobody budgets for — **rotation**. You patch the bug, but now you have to assume *all* of it leaked, because you can't prove otherwise. You rotate everything and hope. That scramble is what convinced me `.env` wasn't "good enough."

The goal isn't to make RCE harmless. You can't. The goal is to make the *default* compromise cheap to reason about: shrink what one dump gives up, and make every secret access something you can point to in code.

## What "good" looks like

Three properties, in priority order:

1.  **No bulk dump.** Reading `process.env` (or a config file, or a log line, or an error report) should yield *ciphertext*, not secrets.
    
2.  **Explicit, scoped access.** Decryption happens only where code asks for a specific key — so the exposed set is "the keys this path touched," not "all of them." And it's `grep`\-able.
    
3.  **Nothing on disk, nothing in the global bag.** Plaintext should live in a small, controlled in-memory store with a clear lifecycle — not sprayed into `process.env` where every dependency can read it.
    

`dotenv` gives you none of these. Let's fix that without adopting a whole new platform.

## The mental model: a Key ID is not a secret

The design decision the whole library rests on: **the only thing a developer ever handles is a KMS Key ID.**

A Key ID (`alias/my-key` or an ARN) is *not* sensitive. You can put it in a Dockerfile, a CI variable, even the top of your `.env`. It's a pointer. The actual key material never leaves AWS KMS, and access is gated by IAM. There's no private key to misplace, no passphrase to Slack to a teammate, no `age` identity file to leak.

This is deliberately the opposite of tools like `age`, PGP, or password-based encryption — all of which hand a human some key material to manage. The day you give a non-expert a private key, you've recreated the problem you were trying to solve. KMS keeps the dangerous part server-side.

So the model is:

```plaintext
Before:  startup → dotenv → process.env 
         (ALL secrets, plaintext, global)
         one dump = total loss; rotate everything.

After:   .env holds ENC[...] ciphertext.
   code → keystore.get("DB_PASSWORD") → KMS decrypt on demand
              → plaintext lives only in the in-memory keystore
   process.env stays ciphertext. No bulk dump. 
   Access is per-key.
```

## How the encryption actually works (symmetric vs RSA)

You hand the library a Key ID. It calls KMS `DescribeKey` to learn the key type, then picks the right strategy automatically:

*   **Symmetric keys (the common case):** each value is encrypted directly with KMS `Encrypt`. Up to 4 KB of plaintext per value — plenty for any env value. The ciphertext is base64 and stored wrapped as `ENC[...]`.
    
*   **Asymmetric / RSA keys:** RSA can only directly encrypt a few hundred bytes, which would truncate real secrets. So the library switches to **envelope encryption**: it generates a one-time data key, encrypts your value locally with AES-256-GCM, and uses KMS to encrypt just that small data key. No size limit, same Key-ID-only ergonomics.
    

You don't choose between these. You pass a Key ID; the library does the right thing. That's the point — the safe path is the default path.

## "Why not dotenvx / SOPS / Secrets Manager?"

All good tools. They solve overlapping but different problems:

| Tool | Model | Where it shines | The catch (for this use case) |
| --- | --- | --- | --- |
| **dotenv** | plaintext `.env` → `process.env` | dead simple | zero protection; full blast radius |
| **dotenvx** | encrypts `.env` with a keypair, injects via `run` | great DX, multi-platform | you manage a **private key**; secrets land in `process.env` |
| **SOPS** | data key wrapped by KMS/age/PGP/etc., file-level | multi-recipient, polyglot, GitOps | file-oriented; still typically decrypts into env or files |
| **AWS Secrets Manager / SSM** | managed secret store, fetched at runtime | rotation, audit, no files | new infra + API calls; you leave the file workflow |
| **secret-keystore** | KMS-encrypted values in `.env`/JSON/YAML, decrypt into an in-memory store | keep your file workflow; **nothing in process.env**; Key-ID-only | AWS-only; not a managed store |

The niche it owns: **you want to keep committing an encrypted config file, you're already on AWS, and you specifically don't want decrypted secrets sitting in** `process.env`**.** If that's you, read on. If you'd rather run a managed store, use Secrets Manager — same KMS underneath.

## Being honest: what this does NOT protect against

A threat model you can't poke holes in is marketing, not security. So:

*   **Full process compromise.** An attacker running code in your process can `require` the keystore, call `.get()`, or dump memory. You still patch and rotate.
    
*   **IAM / credential compromise.** Anyone who can assume your role can call KMS and decrypt. The key is only as safe as the IAM around it.
    
*   **Post-decryption memory scraping.** Once a value is decrypted and in use, it's in RAM.
    

What you *gain* is the thing that mattered during our incident: **no single action leaks everything**, secrets aren't in the default `process.env` bag, committed config is ciphertext, and you can audit exactly which code paths decrypt which keys. That turns "rotate everything and pray" into "rotate the few keys these paths touched."

That's the trade, stated plainly. If it fits your blast-radius goals, the next part gets your hands dirty.

**Next:** [**Part 2 — Encrypt Your .env with One Command →**](/secret-keystore-cli-encrypt-env-aws-kms) — KMS key setup, a least-privilege IAM policy, and a tour of every CLI command.
