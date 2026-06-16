---
title: "Jargon of Microservices"
datePublished: Sun Jun 12 2022 12:19:14 GMT+0000 (Coordinated Universal Time)
cuid: cl4b9wvyb084qq2nv9yi1d0gt
slug: jargon-of-microservices
cover: ./cover.jpg
tags: microservices, design-patterns, jargon
series: microservices-design-patterns

---

Before we get too deep into the world of microservices design patterns, I want to level set on the jargon that I will use when discussing microservices. These are not authoritative. These are just the terminology I learned.

When I discuss microservices, I leverage these terms often, and as such, I just want to define them so that you know where I'm coming from.

# Service Types

The first set of terms that I want to define are **service types**. These will be critical to understanding how various patterns are implement.

### Data Service

A data service is that which connects to a data source within the system. This does not mean databases alone. Any valid source that can be served through a microservice. 

Data services are usually bound by domains defined within the global architecture of the system. 

Examples of these services abound, but a simple one to understand is a product service that deals with a product domain. Usually, these domains have details about products, but not inventory or orders, so they can be built as individual data services.

### Business Service

A business service is a higher level of abstraction that builds on data services. Often, we need to define business domains that transcend individual data services in order to be correct from the business perspective.

Business services can be built around a single data domain if there is more complex business processing that needs to be done in order to operate correctly within the system. 

One of the best examples of this is an order domain. To place an order, you need to have a product and customer data. You also need the inventory data to ensure that the product is available, and then, as the order is placed, you need to charge the customer while decreasing your inventory counts. As you can see, these are usually much more complex systems than a simple data domain. 

### Translation Service

 A translation service is any abstraction on a third party operation that you want to encapsulate under your own facade. 

Think of something like an email sending service. You may actually consume this service from various parts within your system as a whole, but you want to decorate that with sending logs and specific credentials that you don't want littered throughout your overall system. As such, you encapsulate the service with your own translation service. 

The beauty of these services, and why I really like them, is that when you change vendors, or versions, of the third party system, you can maintain your service API and consume the new underlying service without any other code having to change.

### Edge Service

An edge service is responsible for serving data to users and external services. 

These services can be used to provide a web view, a service that delivers that content, and other services that deliver to mobile devices. 

Often, we use edge services to slim down our payloads to make them more mobile friendly, or provide modified payloads that meet the need of a third party contract.

While edge services aren't always used, they can be a powerful layer in a complete microservices architecture.

# Platform

When describing a platform, there are many different things that people can think of. For the perspective of this blog, I will consider the platform as the all-encompassing arena for all service operations across multiple data centres, but thinking of it as whole.

### Runtime for services

First and foremost, and definitely what people consider the platform, is the runtime itself. 

This can include bare metal servers, virtualisation through VMs, either public or private, or containerised runtimes like Kubernetes or Cloud Foundry. 

I have spent time in each and every one of these runtimes and I will be the first to admit that none of them is perfect. 

Running on bare metal servers definitely is the most performant, but there's a lot of pain associated with that.

Kubernetes, on the other hand, is one of the most flexible, but, again, it has its own pain points and I cannot recommend one way or another, but I will tell you this, if you are running on multiple data centres, especially public and private mixed, containerisation starts to become more and more attractive. 

### Ancillary Services

There are also a host of ancillary services that you don't write, but that you run within the runtime that are included in that platform definition. 

These can be things like message queues, cash services, authentication and authorisation services, and various others. 

Some of these may be first class services for your organisation. Like in mine, authentication and authorisation is a first class service that we build upon. 

The key here is that the platform should include everything that your applications need to get work done.

### Operational Components

Also included are operational components. 

These are things like log aggregators and shippers, metrics aggregators and shippers, and various other operations that you need to have running in your platform in order to maintain operational integrity. 

If I have learned anything, especially in the move to more mission critical systems, it's that operational components should never be overlooked in a platform.

### Diagnostic Components

And, finally, I want to talk about diagnostic components. 

These are anything from simple shell scripts that you execute on your local machine to containers running in your runtime that enable you to connect and perform operations from within the runtime itself to diagnose, troubleshoot, and improve system performance. 

For instance, we need to run a container in our runtime that our team needs to connect internally to the Kubernetes runtime itself in a secure fashion. This allows to test both low level components like DNS as well as test the network and associated services within the runtime.

# Conclusion

This article was to get you started on microservices and some of the important jargon that are used. These are important to understand as they will be used quite extensively in the upcoming articles. So now that we understand the jargon and perspective of the terms service types and platforms, I'll be adding details on Cloud Native in my next article.

Thank You :)

- - -
