---
title: "Loading Secrets at Runtime Without Leaking Them: config(), the Keystore, and run"
datePublished: Fri Jun 12 2026 13:17:21 GMT+0000 (Coordinated Universal Time)
cuid: cmqayb6ns000a04jp1c14apfz
slug: secret-keystore-runtime-config-loader-nodejs
cover: ./cover.jpg
tags: aws, nodejs, security, devops, backend
series: encryption

---

> **Part 3 of 3** on [`@faizahmed/secret-keystore`](https://www.npmjs.com/package/@faizahmed/secret-keystore). [Part 1](https://blog.faizahmed.in/nodejs-secrets-threat-model-aws-kms) was the threat model; [Part 2](https://blog.faizahmed.in/secret-keystore-cli-encrypt-env-aws-kms) was the CLI. This part is how your app reads secrets at runtime — safely.

You've got an encrypted `.env`. Now your app needs the plaintext, at runtime, without recreating the blast radius you just removed. There are two ways in.

## Option A: `config()` — the dotenv replacement that skips process.env

If you've used `dotenv`, this will feel familiar — except it does **not** dump anything into `process.env`:

```javascript
const { config } = require('@faizahmed/secret-keystore');

const secrets = await config({
  kmsKeyId: process.env.KMS_KEY_ID
});

const dbPassword = secrets.get('DB_PASSWORD');
// decrypted, in memory only
```

`config()` discovers and **cascades** your env files the way Next.js and `dotenv-flow` do — later files win:

```shell
.env →.env.local→.env.<NODE_ENV>→.env.<NODE_ENV>.local
```

It decrypts the `ENC[...]` values via KMS, passes plaintext values through untouched, and loads everything into an in-memory `SecretKeyStore` that it returns. Nothing is written to disk. Nothing lands in `process.env`. `env` stays boring.

That last point is the whole reason it exists, so it's worth being blunt: a classic `require('dotenv').config()` floods `process.env` with every secret, and a single `env` dump after an RCE gives them all up. `config()` keeps them in a store object you read explicitly — so the exposed surface is "keys this code asked for," and it's `grep`\-able (`.get(`).

There's an escape hatch for true `dotenv` drop-in behavior, **off by default and loud about it**:

```javascript
// Opt in only if you accept the blast-radius tradeoff
await config({ kmsKeyId, populateProcessEnv: true });
// logs a warning; now process.env holds the decrypted values
```

I'd avoid it. The point of the library is to *not* do that.

## Option B: `run` — for apps you don't want to touch

Can't or don't want to change app code? Use the CLI's `run` (covered in [Part 2](https://blog.faizahmed.in/secret-keystore-cli-encrypt-env-aws-kms)) to inject secrets into the child process's environment:

```shell
npx @faizahmed/secret-keystore run \
  --kms-key-id="alias/my-key" -- node server.js
```

`config()` keeps secrets out of `process.env`; `run` puts them into the *child's* `process.env` so unmodified apps work. Pick based on whether you can edit the app. Both keep plaintext off disk.

## The keystore API

Whether you call `config()` or `createSecretKeyStore()` directly, you get the same object:

```javascript
secrets.get('DB_PASSWORD'); // string | undefined
secrets.getAll();           // { KEY: value, ... }
                            // (decrypted map)
secrets.has('API_KEY');     // boolean
secrets.keys();             // ['DB_PASSWORD', 'API_KEY', ...]
secrets.getSection('DB_');  // { DB_PASSWORD: ..., 
                            //         DB_HOST: ... }
secrets.getMetadata();      // { initialized, secretCount,
                            //        sourceType, ttl, ... }
secrets.getAccessStats('API_KEY'); // { accessCount,
                            // lastAccessedAt, expiresAt, ... }
await secrets.refresh();    // re-decrypt from source
secrets.clearKey('API_KEY');// wipe one
secrets.destroy();          // wipe everything; 
                            // call on shutdown
```

A clean shutdown hook is good hygiene:

```javascript
process.on('SIGTERM', () => secrets.destroy());
```

The lower-level entry point, when you already have the content in hand (a file baked into an image, an S3 object, a CI artifact):

```javascript
const fs = require('node:fs');
const { 
 createSecretKeyStore
} = require('@faizahmed/secret-keystore');

const keyStore = await createSecretKeyStore(
  { type: 'env', content: fs.readFileSync('./.env', 'utf-8') },
  process.env.KMS_KEY_ID,
  {
    paths: ['DB_PASSWORD', 'API_KEY'], 
    aws: { 
      region: process.env.AWS_REGION
    } 
  }
);
```

`config()` is the convenience wrapper that does the file discovery and cascade for you; `createSecretKeyStore` is the engine underneath.

## Hardening options

The keystore takes options worth knowing about for production:

```javascript
await config({
  kmsKeyId: process.env.KMS_KEY_ID,
  security: { inMemoryEncryption: true, secureWipe: true },
  access:   { 
    ttl: 3600000, autoRefresh: true, accessLimit: null
  },
});
```

*   `inMemoryEncryption` — keep values AES-256-GCM-encrypted *in the store itself*, decrypting only on `.get()`, so a heap snapshot is less useful.
    
*   `secureWipe` — overwrite buffers on `destroy()`/`clearKey()` instead of leaving them for the GC.
    
*   `ttl` **+** `autoRefresh` — expire and re-decrypt on a schedule (see Lambda below).
    
*   `accessLimit` — cap how many times a key can be read before it's cleared.
    

## Lambda, cold starts, and KMS cost

KMS `Decrypt` is a network call. Two things matter:

1.  **Don't decrypt per request.** Build the keystore **once** outside the handler so it's reused across warm invocations:
    

```javascript
const { config } = require('@faizahmed/secret-keystore');
const ready = config({ kmsKeyId: process.env.KMS_KEY_ID });
// module scope

exports.handler = async (event) => {
  const secrets = await ready;          // resolved once,
                                        // reused while warm
  const key = secrets.get('API_KEY');
  // ...
};
```

2.  **Use TTL for long-lived processes.** On an always-on server, `ttl` + `autoRefresh` re-decrypts periodically so a rotated key gets picked up — without a redeploy and without hammering KMS.
    

The tradeoff is real and worth stating: KMS adds latency on cold start and costs per call. Caching with TTL is how you keep both in check.

## Docker

The encrypted `.env` is just ciphertext, so it's safe to bake into the image (private registry) or mount as a config. The container's IAM role (task role on ECS, instance role on EC2) provides KMS access — no secret material in the image, no secrets in the layer history:

```dockerfile
COPY .env .env      # ENC[...] ciphertext — safe in the layer

# the running task's IAM role is what unlocks it at runtime
```

That's the win over baking plaintext env into an image or passing it as build args (which leak into layer history).

## Rotating keys in production

Two flavors, both painless:

*   **Rotate the KMS key** (re-wrap under a new key): the `rotate` command from [Part 2](https://blog.faizahmed.in/secret-keystore-cli-encrypt-env-aws-kms) decrypts with the old key and re-encrypts with the new one in one pass. Commit, redeploy.
    
*   **Rotate the secret values themselves**: edit, re-encrypt, redeploy. Because access is explicit and scoped, you're not hunting for every place that cached `process.env` — you change the source of truth and ship.
    

After an incident, this is the difference between "rotate the keys these code paths touched" and "rotate everything and pray."

## When you need to *prove* it: Nitro Enclave attestation

For high-assurance workloads, the library supports **AWS Nitro Enclave attestation**: KMS will only release plaintext to an enclave whose attestation document proves it's running the exact code you expect, and it handles the 5-minute attestation refresh for you. That's "runtime trust" — not just *can* this process decrypt, but *is it the code it claims to be*.

I wrote a full explainer on how KMS, Nitro Enclaves, and OpenSSL CMS fit together in [**How AWS Nitro Enclaves Prove You're Running Secure Code**](https://blog.faizahmed.in/aws-nitro-enclaves-remote-attestation) — start there if attestation is on your roadmap.

## Why you can trust it: tests, not vibes

A secrets library you can't verify is a liability of its own. So `secret-keystore` ships with:

*   A **95-test** suite on Node's built-in runner, with AWS KMS fully **mocked** — exercising both the symmetric and RSA-envelope paths, the CLI, `config()`, and rotation, with **no AWS account or network required**.
    
*   **CI on Node 18, 20, and 22**, plus lint, formatting, a coverage gate, and a check that the TypeScript definitions stay in sync with the runtime.
    

Clone it, run `pnpm test`, read the code. The whole point of this project is reducing what you have to take on faith.

## Wrapping up

You started [Part 1](https://blog.faizahmed.in/nodejs-secrets-threat-model-aws-kms) with a `.env` that gave up everything in one `env` dump. You end here with: ciphertext at rest, decryption on demand into an access-controlled in-memory store, secrets that never enter `process.env`, one-command rotation, and — if you need it — cryptographic proof of what's running.

*   **Install:** `npm install @faizahmed/secret-keystore`
    
*   **Repo + runnable Next.js / NestJS examples:** [faizahmedfarooqui/secret-keystore](https://github.com/faizahmedfarooqui/secret-keystore)
    
*   **The origin story:** [Stop Putting Secrets in process.env](https://blog.faizahmed.in/secret-keystore)
    

If you ship Node on AWS and you've ever had to "rotate everything and hope," this is the pattern I wish I'd had before the incident — not after.
