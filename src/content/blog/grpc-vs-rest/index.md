---
title: "gRPC vs REST"
datePublished: Sun Oct 03 2021 11:56:01 GMT+0000 (Coordinated Universal Time)
cuid: ckxemj3h30g9hx4s153wyd4qs
slug: grpc-vs-rest
cover: ./cover.jpg
tags: rest-api, http, http2
series: null

---

The majority of modern APIs are implemented by translating them to the same HTTP protocol in some fashion. It's also becoming typical for RPC API designs to borrow one or two ideas from HTTP while remaining true to the RPC model, broadening the number of options available to an API designer. This article aims to describe the options and provide recommendations on how to pick among them.

**gRPC** is a technology that uses HTTP 2.0 as its underlying transport protocol to build RPC APIs. Because they are based on opposing conceptual models, you could anticipate gRPC and HTTP to be mutually exclusive. The Remote Procedure Call (RPC) concept, in which the addressable entities are procedures and the data is buried behind the procedures, is the foundation of gRPC.

**HTTP** goes both ways. The addressable elements in HTTP are "data entities" (referred to as "resources" in the HTTP specifications), and the behaviours are hidden behind the data—the system's behaviour is determined by creating, changing, and deleting resources.

Most public APIs and many private distributed APIs utilise HTTP as their transport protocol, at least in part because businesses are used to dealing with the security challenges associated with enabling HTTP traffic on ports 80 and 443.

### The two main ways to use HTTP for APIs are:

1. REST

2. gRPC

### REST

REST is the least-used API paradigm; only a small percentage of APIs are built this manner, spite of the fact that the term REST is used (or abused) more generally. Clients do not generate URLs from other information; instead, they use the URLs that are handed out by the server as-is. This is how the browser works: it doesn't piece together the URLs it uses, and it doesn't understand the website-specific formats of the URLs it uses; instead, it just blindly follows the URLs it finds in the current page it receives from the server, or that were bookmarked from previous pages, or that the user enters.

A browser's only parsing of a URL is to extract the information necessary to send an HTTP request, and its only building of URLs is to create an absolute URL from relative and base URLs. Your clients will never have to comprehend the format of your URLs if your API is a REST API, since those formats are not part of the API definition provided to clients.

REST APIs can be quite straightforward. Many other technologies have been developed for usage with REST APIs, such as JSON API, ODATA, HAL, Siren, or JSON Hyper-Schema, although none of these are required to do REST correctly.

### gRPC

gRPC is an example of a second model for using HTTP for APIs. Under the hood, gRPC uses HTTP/2, but HTTP is not exposed to the API designer. Because gRPC-generated stubs and skeletons hide HTTP from both the client and the server, no one needs to worry about how RPC concepts are mapped to HTTP—they simply need to learn gRPC.

The following three steps are taken by a client when using a gRPC API:
1. Determine which procedure to invoke.
2. Determine the parameter values to be used (if any)
3. Make the call with a code-generated stub, passing the parameter values.

### Advantages of REST

The purported benefits of REST are essentially the same as those of the internet itself, such as stability, homogeneity, and universality. They're well-documented elsewhere, and REST is a niche topic, so we won't go into detail about them here. The entity-orientation inherent in the HTTP/REST architecture is an exception. This feature is particularly interesting because proponents of non-REST models such as gRPC and OpenAPI have considered and adopted it.

Entity-oriented models, in my view, are simpler, more consistent, easier to comprehend, and more stable over time than basic RPC models. RPC APIs tend to grow naturally as more procedures are added, each one supporting a different action that the system can take.

The behaviours of the system are organised using an entity-oriented paradigm. For example, we're all aware with the online shopping entity model, which includes products, carts, orders, accounts, and so on. If only RPC procedures were used to describe that functionality, it would result in a large, unstructured list of procedures for exploring product catalogues, putting items to carts, checking out, tracking delivery, and returning items.

The list quickly gets overwhelming, and maintaining consistency between procedure definitions is challenging. Mapping all of the behaviours using a standard set of procedures for each entity type is one method to bring structure and order to the list. HTTP is entity-oriented by default, but you can add entity-orientation to RPC as well. One of the core concepts of object-oriented languages is grouping processes by entity type.

### Advantages of gRPC

gRPC is an interface description language (IDL) that builds on a long legacy of RPC IDLs such as DCE IDL, Corba IDL, and others to define an RPC API. In comparison to OpenAPI's technique of employing URL paths, their parameters, and the HTTP methods that are used with them, gRPC's IDL provides a simpler and more direct manner of constructing remote processes.

Although gRPC supports HTTP/2 behind the scenes, it does not make HTTP/2 available to the API designer or user. gRPC has already decided how to overlay the RPC model on top of HTTP, so you don't have to—those decisions are baked into the gRPC software and generated code. API designers and clients will appreciate how much easier their lives will be as an outcome of it now.

APIs specified in gRPC are simple to implement on the server side. Because of the frameworks, libraries, and code-generation that gRPC provides, it may be simpler to create the server implementation of a gRPC method than to write a standard HTTP request handler that parses incoming requests and calls the right implementation functions, despite the many frameworks that aim to help with that.

Another characteristic of gRPC is good performance. gRPC uses a binary payload that is efficient to create and to parse, and it exploits HTTP/2 for efficient management of connections. Of course, you can also use binary payloads and HTTP/2 directly without using gRPC, but this requires you and your clients to master more technology.

gRPC also avoids the problem that even the best HTTP-based APIs don't implement the whole HTTP protocol, which requires API providers and clients to figure out how to specify and learn which subset of HTTP is supported by a particular API. This is a problem for REST APIs. gRPC avoids this problem by requiring the client and the server to both adopt special software that implements the complete gRPC protocol. I hope gRPC succeeds in keeping that protocol stable for at least 25 years as HTTP has done, so that clients don't break when servers are upgraded and vice versa.

- - -
