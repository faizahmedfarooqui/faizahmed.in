---
title: "Integration Patterns in Microservices"
datePublished: Tue Jun 14 2022 07:38:06 GMT+0000 (Coordinated Universal Time)
cuid: cl4dur1x900au82nv6ohlbhs8
slug: integration-patterns-in-microservices
cover: ./cover.jpg
tags: microservices, design-patterns, integration-patterns
series: microservices-design-patterns

---

Integration patterns allow you to solve orchestration and Ingress needs across your system as a whole. In this article, we are going to discuss integration patterns for microservices.

The first pattern that we're going to talk about is the **gateway pattern**.

# Gateway Pattern

The API gateway pattern or gateway pattern is an Ingress pattern for clients communicating with your system services. 

The problem statement we're trying to solve is that of **chaos**. 

If we allow any client of any system to access any service however they wish, operational and maintenance needs will skyrocket across the system as a whole.

This grows even more chaotic as your clients set increases, especially if third party vendors start consuming your APIs. 

The gateway pattern is designed to provide a buffer between the underlying services and the client needs. That can be accomplished via a facade or a simple proxy, each having risks and rewards.

And this includes client systems that you own. It can simply proxy the calls to your underlying services. It can mutate the calls, or it can limit the calls based on what the gateway itself exposes. This also, however, can become a single point of failure for a system as a whole. So care needs to be taken to ensure that it scales and responds well when the need arises.

### Mutation Behaviours

- Can simply Proxy
- Can decorate Payloads
- Can aggregate
- Can limit access
- Movement buffer

Consider having a web, desktop and mobile clients for your system, as well as public API clients you publish to npm or Maven. 

The gateway pattern gives you a contract driven API point, they can be static while the underlying services can change, migrate and move as needed. The gateway implementation may change, but your clients don't need to feel the pain of that change, because it adheres to your public contract. The strategy for building a gateway is actually very straightforward.

### Strategy

- Define contracts
- Expose APIs for those contracts, client focused
- Adhere to strict version control and passive changes only
- Implement the gateway to call your services and your clients to call the gateway

# Process Aggregator Pattern

The process aggregator is a very straightforward way within your system to develop complex processes. When we have multiple data domains that need to be called together within a business process, we use business process services. 

There may be cases, hopefully infrequently, where you need to do the same for business processes themselves. This is where this pattern comes into play. 

So the problem that we need to solve is we have built out several business processes within our system but we see having frequent need to **call two or more of them at the same time** in certain use cases and then build a **composite response** from it. This is where this pattern shines. 

The aggregator provides **clients with a single API to call**. This API contract not only handles the underlying business process calls, but assembles the payload for the client system. 

The process aggregator can and really should introduce its **own processing logic**. If you are building an aggregator to simply group calls for your clients, you can leverage a gateway aggregator or even just keep the calls in the client.

It can cause long blocking calls.

### Aggregator Design

- Determine the business processes
- Determining the processing rules
- Design a consolidated model
- Design the API for the action on that model
- Wire the service and implement the internal processing

# Edge Pattern 

Much like the aggregator was a subset of the Gateway pattern, the Edge pattern is also a subset of the Gateway pattern. 

The basic problem that we need to solve with the Edge pattern comes in **two flavors**. 

The most common is that using a Gateway becomes a scaling concern as one client type, say mobile, contributes to request volume significantly more than other services. As such, **scaling the Gateway becomes wasteful**. 

The other problem is similar to the aggregation in that a client doesn't just need a single touch point. It **needs special business logic** as well, that only applies to this client.

Edge Services really become very much **client-specific Gateways**. They provide the benefits of aggregation, consolidation companies and complexity isolation, while doing so based on the sole needs of a specific client.

These Edge Services **focus on a specific client**, so their **isolation pattern** is directly addressing that client.

### Edge Design

- Identify Client
- Build Contracts
- Implement Contracts
- Maintain passivity as long as client is needed

# Gateway vs. Edge 

- Similar but different; we're handling things like isolation, consolidation, aggregating and proxying, it's whether is for the whole system or just one client.
- Edge target clients
- Edge more scalable
- Edge is more flexible for new clients
- Gateway has less moving parts

# Conclusion

This article shares some key principles and different patterns to use for the orchestration of different clients while minimising the chaos and maintenance. We covered patterns that handle isolation, consolidation, aggregating & proxying for a specific client or for a system as a whole. I hope this article has given you insights into the topic and hope to see you in the next one.

- - -
