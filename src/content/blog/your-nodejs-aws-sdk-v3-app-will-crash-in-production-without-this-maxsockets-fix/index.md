---
title: "Your Node.js AWS SDK v3 App Will Crash in Production Without This maxSockets Fix"
datePublished: Fri Nov 07 2025 07:03:11 GMT+0000 (Coordinated Universal Time)
cuid: cmhoie5qt000002k051q17ckl
slug: your-nodejs-aws-sdk-v3-app-will-crash-in-production-without-this-maxsockets-fix
cover: ./cover.jpg
tags: maxsockets, aws, nodejs, aws-sdk, production
series: scaling-javascript-nodejs

---

Everything was fine until it wasn’t.

Our Node.js app, powered by AWS SDK v3, started freezing during peak traffic. Requests to S3 and DynamoDB hung indefinitely, ECS tasks began restarting, and the logs were a blur of `ETIMEDOUT` and `Socket hang up` errors.

CPU looked normal. Memory wasn’t maxed out.

So why were our production servers collapsing?

It turned out the culprit wasn’t AWS, wasn’t our code! It was **a hidden bottleneck deep inside the AWS SDK’s connection layer**: the `maxSockets` limit.

## The Real Root: How AWS SDK v3 Actually Works

Most developers assume the SDK just fires HTTP requests directly to AWS.

But that’s not how SDK v3 operates.

It’s built on top of a modular runtime called **Smithy**, which handles everything between your code and the actual network call.

Let’s trace what happens when you do this:

```javascript
await s3.send(
  new PutObjectCommand(params)
);
```

Here’s the actual flow behind the scenes:

```plaintext
S3Client
   ↓
Smithy Client Runtime
   ↓
Middleware Stack (Serializer → Signer → Retryer → Logger)
   ↓
NodeHttpHandler (from @smithy/node-http-handler)
   ↓
Node.js https.Agent
   ↓
AWS Service Endpoint
```

So far, so good. But the issue lies in that **NodeHttpHandler** step.

By default, the handler creates a new `https.Agent` with these settings:

```javascript
new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});
```

That means for each AWS service endpoint, your app can open **only 50 concurrent sockets**.  
Any additional requests will **queue up inside the Agent**, waiting for one of those sockets to free up.

## Why the `maxSockets` Limit Exists

The AWS SDK team chose this limit intentionally.

The Smithy runtime prioritizes **stability** and **low resource usage**, since many users run the SDK in Lambda or short-lived containers.

For light workloads, that’s perfectly fine.

But for **long-running, high-throughput Node.js apps** like those processing hundreds of parallel S3 uploads or batch DynamoDB reads that 50-socket cap turns into a massive bottleneck.

## How It Breaks in Production

When your concurrency exceeds the socket limit, here’s what happens:

1. Only 50 connections to the AWS endpoint can stay open at once.
    
2. The rest of the requests get queued inside Node’s `https.Agent`.
    
3. Those queued promises occupy memory and block the event loop.
    
4. The event loop stalls, CPU spikes, requests time out, and your containers start thrashing.
    

At first, you’ll see small slowdowns.

Then, as traffic spikes, latency shoots up and eventually, **your app just stops responding**.

No AWS throttling. No bad code.

Just a hidden cap you didn’t know existed.

## Diagnosing the Issue

To verify that you’re running into this, inspect the client’s underlying handler:

```javascript
import { S3Client } from "@aws-sdk/client-s3";

console.log(
  S3Client.prototype.config?.requestHandler?.metadata?.agent?.maxSockets
);
```

If that prints `50`, you’re officially throttled.

You can also check live socket usage:

```javascript
console.log(agent.sockets);   // Active sockets
console.log(agent.requests);  // Queued requests
```

If requests are piling up while sockets stay capped, that’s the bottleneck.

## The Fix: Override Smithy’s Default `NodeHttpHandler`

The good news?

You can completely fix this by creating a **custom** `https.Agent` and passing it into your AWS SDK client configuration.

```javascript
import https from "https";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { S3Client } from "@aws-sdk/client-s3";

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 1000, // Adjust based on your instance capacity
});

const s3 = new S3Client({
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
  }),
});
```

This tells the Smithy runtime to use your custom transport handler, which inherits all the SDK middleware (retries, signing, etc.) but with **your own socket configuration**.

## Why This Fix Works

When you raise `maxSockets`, you’re effectively telling Node’s connection pool:

> “Don’t serialize my AWS calls, let them happen concurrently.”

Here’s what changes:

* Requests no longer queue up behind the 50-connection cap.
    
* Event loop latency drops.
    
* CPU utilization becomes stable and predictable.
    
* Your overall throughput scales linearly with hardware resources.
    

In our production load tests, increasing `maxSockets` from 50 → 1000 improved S3 throughput by **3.5×** and cut average request latency from ~2.3s to ~0.6s.

## A Quick Note on Reuse and Environment Variables

To fully optimize, ensure connection reuse is enabled globally:

```javascript
export AWS_NODEJS_CONNECTION_REUSE_ENABLED=1
```

This allows the SDK to reuse existing sockets across invocations (especially useful in Lambda or Fargate).

And remember:

* Always reuse your `Agent` instance. Don’t create one per request.
    
* Enable `keepAlive: true` to avoid costly connection re-establishment.
    
* Set realistic `maxSockets` (500–1000 for EC2/ECS, ~100 for Lambda).
    
* Monitor file descriptors with `lsof -i | wc -l` to avoid FD exhaustion.
    

## Best Practices for Production Environments

| **Setting** | **Default** | **Recommended** |
| --- | --- | --- |
| `keepAlive` | true | ✅ true |
| `maxSockets` | 50 | 🔼 500–1000 |
| `reuse Agent` | false | ✅ true |
| Env Var | none | `AWS_NODEJS_CONNECTION_REUSE_ENABLED=1` |

Additional notes:

* For short-lived runtimes, define your agent **outside** the Lambda handler.
    
* For apps using multiple AWS services (S3, SES, SNS), share the same agent.
    
* Tune your socket count gradually — start low, benchmark, then scale up.
    

## Why Smithy Makes This Trickier

The key takeaway:

You’re not configuring Node directly, instead you’re configuring **Smithy’s transport layer**.

Every AWS service client (S3Client, DynamoDBClient, SNSClient) inherits from the Smithy `Client` base class, which bundles its own middleware and transport logic.

That’s why simply setting `http.globalAgent.maxSockets` won’t work, you need to explicitly pass your `https.Agent` to the **Smithy-powered** `NodeHttpHandler`.

Once you understand that architecture, everything clicks.

You’re not fighting AWS, you’re just giving Smithy permission to use your hardware fully.

## The Bottom Line

If your Node.js app talks to AWS services at scale, this fix isn’t optional - it’s production-critical.

By default, the AWS SDK v3 (through Smithy) silently limits concurrency to 50 connections per endpoint.

That’s enough to kill high-traffic apps.

The fix is simple: Override the handler with your own `https.Agent`, enable keep-alive, and scale `maxSockets` based on your workload.

You’ll immediately notice:

* Faster response times
    
* Zero socket starvation
    
* Stable CPU and memory under load
