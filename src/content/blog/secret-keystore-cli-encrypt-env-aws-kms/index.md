---
title: "Encrypt Your .env with One Command: The secret-keystore CLI"
datePublished: Fri Jun 12 2026 12:59:34 GMT+0000 (Coordinated Universal Time)
cuid: cmqaxobmv000004jr9so3ebxh
slug: secret-keystore-cli-encrypt-env-aws-kms
cover: ./cover.jpg
tags: aws, security, nodejs, backend, devops
series: encryption

---

> **Part 2 of 3** on [`@faizahmed/secret-keystore`](https://www.npmjs.com/package/@faizahmed/secret-keystore). Part 1 covered the [threat model](https://blog.faizahmed.in/nodejs-secrets-threat-model-aws-kms); this part is pure hands-on. By the end you'll have an encrypted `.env` and know every command that touches it.

## Step 0: a KMS key and a scoped IAM policy

You need one KMS key. A **symmetric** key is the right default (cheaper, no size limits, fewer moving parts):

```shell
aws kms create-key --description "secret-keystore"

aws kms create-alias \
  --alias-name alias/my-app-secrets \
  --target-key-id <key-id-from-previous-command>
```

Now scope the permissions. Two distinct surfaces:

**Encrypting** (locally or in CI) needs `Encrypt` + `DescribeKey`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "SecretKeystoreEncrypt",
    "Effect": "Allow",
    "Action": ["kms:Encrypt", "kms:DescribeKey"],
    "Resource": "arn:aws:kms:us-east-1:YOUR_ACCOUNT:key/YOUR_KEY_ID"
  }]
}
```

**Decrypting** (your running app) needs only `Decrypt` + `DescribeKey`. This is the policy that ships to production — least privilege, one key:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "SecretKeystoreDecrypt",
    "Effect": "Allow",
    "Action": ["kms:Decrypt", "kms:DescribeKey"],
    "Resource": "arn:aws:kms:us-east-1:YOUR_ACCOUNT:key/YOUR_KEY_ID"
  }]
}
```

`DescribeKey` is what lets the library auto-detect symmetric vs RSA. Scope by key ARN at minimum; tighten with encryption-context conditions if your deployment supports it.

## Step 1: install and scaffold

```shell
npm install @faizahmed/secret-keystore

# scaffold a starter .env (refuses to overwrite
# an existing one)
npx @faizahmed/secret-keystore init
```

`init` drops a template like this:

```shell
# Reserved keys (never encrypted):
KMS_KEY_ID=alias/my-app-secrets
AWS_REGION=us-east-1

# Your secrets:
DB_PASSWORD=change-me
API_KEY=change-me
```

`KMS_KEY_ID` and `AWS_REGION` stay plaintext — they're configuration, not secrets. Everything else is fair game.

## Step 2: encrypt

```shell
# Encrypt specific keys
npx @faizahmed/secret-keystore encrypt \
  --kms-key-id="alias/my-app-secrets" \
  --keys="DB_PASSWORD,API_KEY"

# Or all non-reserved keys
npx @faizahmed/secret-keystore encrypt \
  --kms-key-id="alias/my-app-secrets"
```

The file is rewritten in place:

```shell
KMS_KEY_ID=alias/my-app-secrets
AWS_REGION=us-east-1
DB_PASSWORD=ENC[AQICAHh2nZPq...]
API_KEY=ENC[AQICAHh2nZPq...]
```

That `ENC[...]` wrapper is the marker the library uses to know what to decrypt; everything else is passed through untouched, **comments and all**. You can now commit this to a private repo — without the KMS key and IAM access, it's noise.

Useful flags:

*   `--patterns="**.password,**.secret"` — glob-match keys (great for nested JSON/YAML).

*   `--exclude="PUBLIC_URL"` — skip keys.

*   `--output="./.env.enc"` — write somewhere else instead of in place.

*   `--dry-run` — preview which keys would be encrypted.

*   `--format=json|yaml` — override auto-detection (it reads the file extension by default).

*   `--use-credentials` — use `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` instead of the ambient IAM role (handy locally).


JSON and YAML work the same way:

```shell
npx @faizahmed/secret-keystore encrypt \
  --path="./config.yaml" \
  --kms-key-id="alias/my-app-secrets" \
  --patterns="**.password,**.apiKey"
```

## Step 3: inspect — without leaking anything

Two read-only commands that **never print values**:

```shell
# Just the key names
npx @faizahmed/secret-keystore keys --path="./.env"
# DB_PASSWORD
# API_KEY

# Which keys are encrypted vs still plaintext
npx @faizahmed/secret-keystore status --path="./.env"
#   🔒 encrypted  DB_PASSWORD
#   🔓 plaintext  PUBLIC_URL
# 📊 1 encrypted, 1 plaintext, 2 total
```

`status` is the one you run in CI to catch a secret someone forgot to encrypt.

## Decrypt (when you actually need the file back)

```shell
# In place
npx @faizahmed/secret-keystore decrypt \
  --kms-key-id="alias/my-app-secrets"

# To a separate file
npx @faizahmed/secret-keystore decrypt \
  --path="./.env.enc" --output="./.env" \
  --kms-key-id="alias/my-app-secrets"
```

For *running* your app, prefer `run` or the in-memory loader (Part 3) over decrypting to disk — but `decrypt` is there when you need the plaintext file.

## Edit without ever hand-writing ciphertext

You can't sanely edit `ENC[AQICAHh2...]` by hand. `edit` handles the round-trip:

```shell
EDITOR=vim npx @faizahmed/secret-keystore edit \
  --kms-key-id="alias/my-app-secrets" --path="./.env"
```

It decrypts into a `0600`\-permission temp file, opens your `$EDITOR`, re-encrypts exactly the keys that were encrypted before, writes back to the original, then **shreds the temp file** (overwrite + delete). Plaintext touches disk only for the seconds your editor is open, in a restricted file. (Want zero plaintext on disk ever? Skip `edit` and edit the source before encrypting.)

## Rotate keys without re-typing secrets

Key rotation is the command most tools make painful. Here it's one line — decrypt with the old key, re-encrypt with the new one, in a single pass:

```shell
npx @faizahmed/secret-keystore rotate \
  --old-kms-key-id="alias/old-key" \
  --kms-key-id="alias/new-key"
```

It only touches values that were already encrypted; plaintext stays plaintext. Perfect for a scheduled rotation or for the "rotate everything" fire drill after an incident.

## Migrating an existing plaintext .env

Already have a plaintext `.env` from the `dotenv` days? `import` encrypts it in place:

```shell
npx @faizahmed/secret-keystore import \
  --kms-key-id="alias/my-app-secrets"
```

(It's `encrypt` tuned for migration — all non-reserved keys, in place — with friendlier output.)

## Run your app with secrets injected

The headline command. Prefix your normal start command and the secrets are decrypted and handed to the **child process's** environment — no code change:

```shell
npx @faizahmed/secret-keystore run \
  --kms-key-id="alias/my-app-secrets" -- node server.js
```

`run` reads your `.env` cascade, decrypts via KMS, and `spawn`s `node server.js` with the decrypted values in *its* env. Your app reads `process.env.DB_PASSWORD` as usual. The parent CLI process never holds them.

One honest caveat: because the child gets the values in its environment, code running *inside that child* can read them via `env`. That's unavoidable for any "run a process with secrets" tool. If you want secrets to stay out of `process.env` entirely, that's exactly what the `config()` loader in Part 3 is for.

## The whole command set

```shell
npx @faizahmed/secret-keystore <command> [options]

encrypt   Encrypt selected values (in place or --output)
decrypt   Decrypt ENC[...] values (in place or --output)
run       Decrypt and launch a command with secrets in the child's env
rotate    Re-encrypt under a new key (needs --old-kms-key-id)
edit      Decrypt → $EDITOR → re-encrypt (secure temp file)
init      Scaffold a starter .env
keys      List key names (no values)
status    Show encrypted vs plaintext (no values)
import    Encrypt an existing plaintext .env in place
```

That's the full CLI. Everything auto-detects `.env`/JSON/YAML from the extension, and everything takes the same `--kms-key-id`, `--region`, and `--use-credentials` flags.

**Next:** [**Part 3 — Loading Secrets Without Leaking Them →**](https://blog.faizahmed.in/secret-keystore-runtime-config-loader-nodejs) — the `config()` loader, the keystore API, TTL for Lambda, Docker, production rotation, and Nitro attestation.
