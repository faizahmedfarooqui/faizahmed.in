---
title: "Operational Patterns in Microservices"
datePublished: Thu Jun 16 2022 10:14:21 GMT+0000 (Coordinated Universal Time)
cuid: cl4gv7pgl048lh2nv23hhfhoc
slug: operational-patterns-in-microservices
cover: ./cover.jpg
tags: microservices, design-patterns, operational
series: microservices-design-patterns

---

Now we'll concentrate at our final set of patterns, which are operational patterns. These are noteworthy in that they are engaged with how you run your system rather than how you build it. However, they are proven and true approaches. 

The first is **log aggregation**, which we will discuss.

# Log Aggregation

### Logging

So I'll dive into this pattern by first talking about the source and that is the logs themselves.

- The problem is that you need to know what is going on
- Logging is invaluable in operations
- Logging must be consistent
- Logging must be structured
- Logging must share a common taxonomy

### Log Aggregation

Log aggregation is a key pattern in the operations of a microservices based system. 

In monolithic models, the log messages usually all go to the same output. As such, they are essentially aggregated on their own. With microservices however, it's a different thing.

- The problem is that the logs are everywhere
- Aggregation of logs into a single stream of data
- Parsing of logs (The more structured you create the log & the more easy it'd be to parse your log)
- Correlating of logs
- Indexing of logs (Common structure; common taxonomy helps with indexing the logs for rapid search)

Structured logging frameworks exist and almost every language has them. Log parsing and shipping exists for almost every common aggregation platform. You just need to build a common taxonomy and document it, and then let the tools do their job across your system as a whole.

# Metrics Aggregation

Metrics, like log aggregation, are useful for spotting problems in the field.

In fact, when done appropriately, metrics can be more powerful than logs. Metrics are also less difficult than logging since there is less human engagement.

The log message is written and structured by a developer. Metrics, on the other hand, usually only necessitate a small amount of instrumentation.

### Metrics Collection

- The problem that we are looking at is to see what is going on with the system. We aren't really looking at code output, we're looking for system output.
- Taxonomy; once again a common taxonomy is critical with metrics.
- Standard libraries
- Metrics shipping
- Dashboards are powerful; especially for on-call activity.

### Learning Experience

- Build high-level dashboards
- Build detailed (low-level) dashboards against problems identified through high-level dashboard
- Inject events, especially deployments
- Trace alarms on your graphs
- Ensure you have runbooks for all alarms; If you build an alarm, you know why the alarm fired. The runbook will make troubleshooting significantly easier. 
- Embed links to runbooks into the pages themselves, as well as the dashboards, again, making life easier for on-call, which ultimately is the point of all operational patterns.

# Tracing 

Tracing is one of those things that, once you build it, you'll regret not having it before that time. 

Consider for a moment a monolithic system. All code execution from edge to database call was in a single process. As such, a code trace will help you recreate the path that that service call took. 

In a microservices architecture, however, that **is gone because calls span processes as well as network, not jut functions**.

**Tracing gives you a way to recreate the call stack** by injecting a trace identifier into every call. The tracing identifier **should span from the edge to the database**.

By leveraging tracing & honouring the tracing identifier, **no call is ever lost**.

### Learning Experience

- Use standard-based approaches; open standards allow you to use off-the-shelf tooling to introspect your system.
- Inject at the entry point to your system
- Every log message should embed the trace ID through structure logging with common taxonomy
- Leverage tracing tools and application performance management (APM) to visualise
- Don't reinvent the wheel when awesome things are already available on Internet

# External Configuration

In a microservices architecture, external configuration is not a hard and fast necessity, as it is in a cloud native design, but its value becomes operationally essential when load and service mobility occur.

Externalised configuration and microservices provide more value in terms of operations than distribution. When you have systems running and issues occur, having a clear spot to see configuration outside of code can greatly impact the meantime to resolution.

The key here is to —

- Use consistent tooling
- Use consistent naming
- Err on the side of externalisation
- Protect secrets

### Learning Experience

- Config is injected or retrieved
- Application utilises externalised values in favour of embedded values; however, defaults can be useful
- Common libraries or tooling helps
- Read, config, and act

# Service Discovery

The complexity of locating the relevant service that delivers the models and behaviour you want rises with the size of a microservices architecture. 

Enter into the picture service discovery process. 

Service discovery may save you a lot of time, especially in a dynamic runtime where service placements might alter by scaling events and geographic location. 

The key here is to —

- Identify the problem that what service do I call? (To perform some body of work?)
- Central location of all services
- Advertise what they offer
- Find what you need
- Consume the URI from the discovery engine, not config

This methodology is far more extensible than basic configuration. However, developing a discovery mechanism in clients is outside the scope of this course. But I will admit that there are off-the-shelf components in libraries. If at all feasible, use them. 

Netflix, for example, has done an excellent job of open sourcing many of their components related to service discovery, and they are an example of a corporation that runs thousands and thousands of microservices, all of which are built on service discovery.

# Conclusion

This article helps us with the operational things around our codebase or application. Operational pattern helps us with how we run our applications and we can do it using logging, metrics aggregations, tracing, external configuration and service discovery.

I hope this article about operational patterns has helped you understand microservices a bit more better.

- - -
