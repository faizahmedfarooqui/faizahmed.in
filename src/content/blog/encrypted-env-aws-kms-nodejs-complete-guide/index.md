---
title: "Encrypted .env for Node.js with AWS KMS: The Complete Guide"
datePublished: Thu Jun 12 2026 00:00:00 GMT+0000 (Coordinated Universal Time)
cuid: demo-encrypted-env-aws-kms
slug: encrypted-env-aws-kms-nodejs-complete-guide
cover: https://cdn.hashnode.com/res/hashnode/image/unsplash/abc123/upload/v1700000000000/cover.jpeg
tags: nodejs, aws, security, kms
series: encryption
---

This is a demo fixture used to verify code highlighting and Mermaid rendering. Replace with real content.

## A code block

```js
import { KMS } from "@aws-sdk/client-kms";

const kms = new KMS({ region: "ap-south-1" });

export async function decryptEnv(ciphertext) {
  const { Plaintext } = await kms.decrypt({
    CiphertextBlob: Buffer.from(ciphertext, "base64"),
  });
  return Buffer.from(Plaintext).toString("utf-8");
}
```

## A Mermaid diagram

```mermaid
flowchart LR
  A[App start] --> B{Encrypted .env?}
  B -- yes --> C[Call AWS KMS decrypt]
  C --> D[Load into process memory]
  B -- no --> E[Read plaintext .env]
  D --> F[Run app]
  E --> F
```

That's it — both should render correctly after build.
