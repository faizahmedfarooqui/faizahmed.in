---
title: "Decomposition Patterns in Microservices"
datePublished: Tue Jun 14 2022 06:16:04 GMT+0000 (Coordinated Universal Time)
cuid: cl4drtkkq09gsjpnv8lr98jwv
slug: decomposition-patterns-in-microservices
cover: ./cover.jpg
tags: microservices, patterns, decomposition-patterns
series: microservices-design-patterns

---

We have talked about microservices being smaller, but what does that really mean?

Consider for a moment how you decompose a problem when writing a piece of software. You don't cram everything into a single function and finish. 

You break the problem into logical steps and convert those steps into reusable functions that can be used as the code base grows. 

This is much the same with microservices, but instead of a single problem statement, you are looking at all of the problems across the system as a whole, that you're operating within.

# Functional Use Patterns

The first area of decomposition we will talk about is the service types that you can create. These are designed to provide very specific uses across the system as a whole. Each service has a distinct function in the system and through building these services, we decompose the problems we need to solve into smaller blocks of work.

## Domain-based Microservices

Domain-based microservices, as you might imagine, are based on domain-driven design patterns, but what does this mean in practice to someone building out a services architecture? 

Data domain decomposition is the lowest level of decomposition that you will usually see in a microservices architecture. The core problem we're trying to solve with this is to make our services more scalable, as such you'll need them smaller and much more focused. 

Decomposition of the domain level is one of the most efficient ways to do that. 

### Data Domain

- Driven by the data domain itself
- Underlying schema is not important
- Focus on the data patterns

### Data Domain Design

- Domain-driven design 
- Start with the model, not the database
- Evaluate actions
- Build the service, contracts first

## Business process-based Microservices

When constructing decompositions, you may encounter more sophisticated procedures in some circumstances. These processes frequently do not fit into a single domain, yet the domains themselves can exist independently.

Enter business process-based microservices into the scene. A business process service can aid in the development of a more organised microservices architecture. The issue may be that in order to replicate business operations across different components, you must recreate the same programming logic numerous times. Particularly when they cross numerous realms. You may use business process domains as a higher level of service inside your architecture to conform to the don't repeat yourself principle and to assist simplify your design.

### Business Process Domain

- Provide higher-level business functionality
- Allow you to encapsulate related domains
- No database access 
- Distinct functional uses

### Business Process Design

- Identify process
- Identify domains
- Define API (contracts not models)
- Wire service (Wire APIs)

## Atomic Transaction-based Microservices

There are potentially times in a microservice's architecture where you need to have true atomic transactions because eventual consistency isn't good enough. 

Atomic transactions are sometimes needed in a system. When those atomic transactions span multiple data domains there is a distinct need to build special logic and systems to handle these unique use cases.

### Atomic Transaction

- Guarantee atomicity, consistency, isolation and durability (ACID) transactions across domains
- Provide failure domains and rollbacks
- Force blocking until commit
- Don't use distributed transactions

### Atomic Transaction Design

- Ensure you must have the atomic service
- Domains must be in shared database
- Clearly get the transaction defined, including rollback conditions
- Implement the service as normal, with fast fail and rollback

# Strangler Pattern

Now that we have discussed some of the most common decomposition patterns, we need to talk for a bit about how to get there from a legacy system.

- Break a monolith up by "strangling" the dependency on it
- Can be top down (From API to Database)
- Can be bottom up (From Database to API)
- Essentially carving out functionality

# Sidecar Pattern 

The sidecar pattern is used to offload processing of some kind to a separate module. 

With the sidecar pattern, you deploy the sidecar as a module associated with every applicable microservice in your architecture in order to offload the processing through a single deployment.

It's more about removing repetitive code across services than anything else.

The reason that it is helpful in a microservices architecture is things like logging, monitoring and network services can be offloaded to a separate module. So essentially, the problem we are solving is repeating code paths that don't have to be accomplished through repeating code.

### Sidecar Design

- Determine the process
- Build the sidecar
- Schedule it to deploy with the appropriate services
- Functionality appears without embedding it

# Conclusion

This article shares some key principles and a number of patterns to use to incrementally decompose an existing system ie. migrating our monolith architecture-based application into microservices architecture.

We covered patterns that can work to migrate functionality out of systems hard to change, and looks at the use of strangler pattern, sidecar pattern, change data capture, database decomposition and more.

Thank You :)

---
