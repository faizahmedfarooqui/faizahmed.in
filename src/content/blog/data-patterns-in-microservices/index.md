---
title: "Data Patterns in Microservices"
datePublished: Tue Jun 14 2022 21:01:46 GMT+0000 (Coordinated Universal Time)
cuid: cl4engky302ay0vnvgacwa4w1
slug: data-patterns-in-microservices
cover: ./cover.jpg
tags: microservices, design-patterns, data-patterns
series: microservices-design-patterns

---

We will now go into the world of data patterns in a microservices-based architecture. There are just a few options for addressing your data requirements. However, we will begin with what is likely to be the most prevalent design, the single service database pattern followed by shared service pattern, command query responsibility segregation & async eventing.

# Single Service Database

Also, commonly referred as Single Service, Single Database. 

As I stated before, the single service, single database pattern should be the most common pattern for all data domain-based services in a microservices architecture. 

The concept is actually very simple, but can be cost-prohibitive if used with proprietary databases or improperly-sized databases. 

The problem that we will be solving with this pattern is that of **scalability**. 

The service scalability requirements in a microservices architecture should be proportionate to the database scaling requirements. As the demand on a single service grows, so does the database's consumption. This might lead to you sizing the database based on a single service's peak demands while the entire system is underutilised.

In this pattern, each data domain that you build gets **its own dedicated data store**. The caveat here is that if the domain also is included in an atomic transaction, you have to be a little bit less fine grained. So hard and fast rules seldom apply, it's really best case effort. 

As your service scales in this pattern, your **data store itself also scales**. 

This is the key benefit of this pattern, because the **data domain is isolated**, and **the data store itself is also isolated**, you **can scale both of them up or down without impacting this system** as a whole. 

If you really build this right, you could actually **isolate your data per region** while your system still functions as a whole, but that's much more advanced than we're going to discuss.

# Shared Service Database

The shared database pattern isn't really much new, especially if you have done some application development in your life. 

In actuality, this is an enterprise design that has been carried over into a distributed paradigm, such as microservices, owing to previously negotiated contracts. However, there are various ways we may pattern our data in our data storage to make it more efficient for eventually splitting up the database.

The given in this case is that **all data domains exist within a single database** instance. The key here is we can still treat them as separate databases from a code concept even if physically they are single instance. 

**Data distribution should still be handled by the database** itself. If you're deploying to multiple data centers, you need the database to handle the data synchronisation across the data centres themselves. Pushing that to code will cause databases to become out of sync. 

While we won't get the scalability benefits of a single instance database, we can structure our data so that we can isolate it and prepare it for a hopeful breakout one day. 

To do this, we need to **leverage schemas, key spaces, or similar logical groupings within the database** engine itself. This way our code will be written with a single database isolation model, even if the database is shared. 

To ensure we have proper segmentation, **each schema and each service that consumes that schema should have unique credentials**. Those credentials should never span the logical breaks. 

If you have a user that can connect to multiple schemas, you might as well stick with the existing model that you have. The idea here is to break it up, even if only logically. 

In a similar vein, the **data domain should connect to a single schema**. 

# Command Query Responsibility Segregation

The CQRS pattern is by far the most complex of all the patterns that we discussed so far and is one of the most ethereal concepts of Microservices.

Those that get it well and can implement it successfully, can dramatically improve their data behaviour across the system as a whole. 

The core pattern we are solving is that our data access patterns diverge from traditional CRUD to more **complex multi-model patterns within a single bounded context**.

- Multi-model bounded contexts
- Multi-interface operations, write versus read
- Divergence from simple CRUD
- Dramatically increases complexity

When you need special type of processing and want to go beyond business processes to accomplish the access pattern, CQRS can be great if implemented correctly. But, if it isn't it can cause a nightmare from a maintainability and operational perspective.

## When does CQRS make sense? 

### Task-based UI operations

A common place that it is attempted is with task-based user interfaces. As the write model focuses on the tasks, the read models are based on the system state after the interactions from that task.

### Eventual consistency is a must

Because of how these systems work, eventual consistency isn't just something you can live with it's a must have. You must fully accept that you cannot read data that was just written and be guaranteed its state. As such, your use cases must match this model.

### Event-based models

Additionally, event-driven models also play well in this use case. When triggers and system events occur from the write operations, the CQRS model works well because reading what was just written doesn't make sense.

I personally haven't implemented CQRS. This is a very complex topic and if you read many blog posts you will see failure after failure of implementing this because it's not easy. But like I have stated above, when it's done right it is extremely powerful and it reduces the complexity of your system as a whole, even though this component itself becomes much more complex.

# Asynchronous Eventing 

Many times in a microservices architecture, you run into situations with long-running transactions or complex workflows that just cannot fit into a single, blocking API call. Enter into the picture asynchronous eventing. 

The problems we can solve go beyond what I just described. But essentially, in a nutshell, we can describe the super set of problems as some process that **cannot be done in real-time through a blocking call**. 

The pattern deployed depend upon the use cases. But they all share a common thread, **a service API that triggers the event**.

The **event can cascade asynchronously from the API** itself, putting together a series of actions that happen behind the scenes, after the client has received an accepted message from the service API.

You can also make a single blocking call and put **a message on a messaging system**. Once that is done, the service returns and the behind-the-scenes processing occurs in an asynchronous manner.

One key characteristic of this model is how powerful it can be in a distributed system. Nothing is a silver bullet when it comes to software. But, there are many complex problems in distributed systems that asynchronous eventing can solve.

# Conclusion

This article helps us in managing & manipulating our data to & from the system as a whole or a target client.

We covered patterns that can work synchronously & asynchronously which eventually helps us to process things faster & in an efficient manner.

- - -
