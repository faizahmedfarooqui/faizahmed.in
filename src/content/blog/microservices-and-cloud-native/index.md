---
title: "Microservices & Cloud Native"
datePublished: Mon Jun 13 2022 09:14:14 GMT+0000 (Coordinated Universal Time)
cuid: cl4ciqu680cwxq2nvdktegto6
slug: microservices-and-cloud-native
cover: https://cdn.hashnode.com/res/hashnode/image/unsplash/wsHwYxu-rkc/upload/v1655040370048/M4t8rZJOh.jpeg
tags: microservices, design-patterns, cloud-native
series: null
---

Let me start the blog by making one thing very clear — Microservices do not make a system Cloud Native & Cloud Native does not require Microservices.

All too often this topic gets confounded. I want us to be very clear from the beginning about it.

Now, from my perspective, and from the perspective of this blog, we're going to focus more on how to utilise Microservices in a Cloud Native pattern for building our system.

Why you may ask? Because Cloud Native can literally run anywhere, not just in the cloud.

# Cloud Native

Let's talk a little bit about what Cloud Native means.

## Architectural Style

First of all, Cloud Native is an architectural style.

What that means is that it isn't a pattern per say, of how to solve a problem. Instead, it is a way of doing processes and building systems to facilitate an end goal.

## Designed to facilitate operating in the cloud

Cloud Native is designed primarily to facilitate operating in the cloud.

This is a very distinct meaning in Cloud Native environment. It includes things like externalising configuration, focusing on scalability, making your application startup fast, and handle immediate shutdowns gracefully.

There's a whole plethora of ways to represent Cloud Native applications. Be them things like 12-factors, 15-factors, or whatever you may call it.

## Focuses on portable and scalable applications

One very clear key and summed up in much of the operations needs, is that Cloud Native applications are designed to be portable and scalable.

Portability comes into play when you can deploy or move your applications anywhere globally and they still work without adding additional code.

Scalability entails building your applications to run as a single unit or multiple units, depending on the overall needs of your system. Advanced designs like using auto scaling to allow your services to scale up or down based on the overall system load, increase the need for this scalability.

## Can be run in single data centre

It is very important to note that Cloud Native designs can be run in a single datacenter.

There is nothing that prevents you from building Cloud Native applications and running them in your corporate single instance datacenter. This is perfectly acceptable and actually, it's a very powerful way to do things because it will allow you to grow to multiple data centres as your business and user needs also grow.

# Microservices

Let's talk about Microservices a bit and that's after all, why we're here.

I want to start by saying that this is very open to personal interpretation. There is no clear definition of what makes a Microservice micro. I have seen nano services that go overboard, and I've seen smaller mono less that don't go far enough.

Microservices are what you make them. But dependency graphs help determine the right size. And we'll review quite a bit about this throughout the course.

### Smaller Scoped Units of Work

When we used to build large files in our application that had multiple endpoints, sometimes hundreds or thousands of them that covered many business domains, we would then deploy these monolithic app files as part of a month often, to large WebLogic servers. Scaling these systems was a massive undertaking.

Microservices are all about breaking those endpoints into distinct units of work, so we can scale them independently, among other things.

### Focus on data, business, or function domains

Microservices are built to focus on units of work that span data domains, business domains, or functional domains, each as individual units.

We look at call patterns and dependency graphs to find the sweet spot where the service boundary should be. But the core concept here is that Microservices can scale independently.

If your customer domain is experiencing high request volumes, but your order domain isn't, you can scale one without impacting the other and eating up your compute resources unnecessarily.

### Not Monolithic Service Artifacts

Unlike monolithic service artifacts, we don't get too far in the weeds of where to break them down appropriately. Instead, we focus on them being individually scalable, hence, they are not monolithic artifacts.

Now, I have some services that may be considered large in some circles. But I leveraged dependencies call patterns and focus from there, not really caring about the size when I'm defining a Microservice.

# Why They Go Together?

### Scalability

Both Cloud Native development practices and Microservices architectures, put an emphasis on building scalability into your application and system as a whole.

Now, often, when building Cloud Native systems, Microservices appears to be clear path to getting there. And this can muddy the water some when talking about these two topics.

### Can Run One without the Other

It is important to note that you can do Cloud Native development without building Microservices. And likewise, you can build micro services, not targeting Cloud Native deployments.

It is important to make sure that this is clear. All too often I hear people talking about one topic, and implying the other. I have seen monolithic applications written to be Cloud Native. And I've seen Microservices designs that could never run in a public or private cloud without significant refactoring.

So I do want to discuss for one moment here, why these very distinct concepts often get discussed together? And the answer simply is because they do go hand in hand very often.

I would not consider a new Cloud Native deployment without using Microservices architectures, at least at the current time.

There just is so much crossover when solving the needs for scalability, to not use Microservices when building a Cloud Native system.

So then, as we discussed, consider that we will be directing our conversation towards Microservices built for Cloud Native deployments because most often even though they are so distinct, they work so well together to solve the common problem.

# Conclusion

It is important to talk about why cloud native solutions and microserices work well together. All too often I hear people talking about one topic, and implying the other. I have seen monolithic applications written to be Cloud Native and I've also seen Microservices designs that could never run in a public or private cloud without significant refactoring.

So I do want to discuss for one moment here why these very distinct concepts often get discussed together? And the answer simply is because they do go hand in hand very often. I would not consider a new Cloud Native deployment without using Microservices architectures, at least at the current time.

There just is so much crossover when solving the needs for scalability to not use Microservices when building a Cloud Native system. As we discussed, consider that we will be directing our conversation towards Microservices built for Cloud Native deployments because most often even though they are so distinct, they work so well together to solve the common problem.

I hope this article has helped you to understand the topic of cloud-native and microservices.

Thank You :)
