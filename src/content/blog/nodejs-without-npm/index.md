---
title: "NodeJS without NPM"
datePublished: Sun Aug 19 2018 18:30:00 GMT+0000 (Coordinated Universal Time)
cuid: ckqenvvwg0htqd6s15dn73oku
slug: nodejs-without-npm
canonical: https://medium.com/@faizahmedfarooqui/node-framework-without-using-npm-6910087a106a
cover: ./cover.jpg
tags: nodejs, npm, web-development, apis, rest-api
series: scaling-javascript-nodejs

---

This article lists things that we can achieve in NodeJS without using any NPM dependencies. You can find the repository on GitHub — [faizahmedfarooqui/nodejs](https://github.com/faizahmedfarooqui/nodejs).

Let's review things that we could developing using only low-level NodeJS APIs;

# RESTful API:

  - A server to listen to HTTP/HTTPS requests ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/server.js#L26-#L39))
  - Deflate / GZIP Compression for HTTP/HTTPS created servers ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/server.js#L151-#L179))
  - RESTful API to CRUD and many more for users, tokens & checks ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/handlers.js#L65-#124))
  - Router for request methods like GET, POST, PUT & DELETE ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/router.js))
  - Handlers(ie. controllers) to handle requests & their methods ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/handlers.js))
  - Model Base class ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/data.js))

# Workers:

  - A Worker to execute things in the background ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/workers.js))

# Logging:

  - A logging logic that logs everything into a *.log file ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/logs.js))

# Compress & Decompress:

  - A gzip compression logic which compresses older log file ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/logs.js#L69-#L110))

# Debugging:

  - Local debug environment for the developments in each file ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/server.js#L15-#L16))

# Serve Routes & Templates:

  - A use of template logic & data interpolation ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/helpers.js#L116-#L182))

# Serve Static Assets:

  - Logic to serve static assets to the web-app ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/helpers.js#L184-#L199))
  - Web routes handler for serving pages & static assets ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/handlers.js#L28-#L63))

# CLI Tool with Input Handlers & their Responders:
 
  - The CLI tool that runs using node’s readline, events libraries & many more ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/cli.js))
  - CLI Events handlers ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/cli-handlers.js))
  - CLI Events responders ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/cli-responders.js))

# Handling Error Crash:

  - Server request are handled using try-catch block & now rather than app crash send 500 error response ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/server.js#L88-#L99))

# Debugger Mode:

  - For detailed information, please use its official [documentation](https://nodejs.org/api/debugger.html) from NodeJS.
  - To run the app in debugger mode, use command `node inspect index-debug.js`

# Performance Hooks:

  - Added PerformanceObserver Node Class to observe all the entries & log them out to the CLI ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/https/controllers/api/tokens.js#L12-#L31))
  - Added Performance Mark & Measure methods to measure all the marked performance steps ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/https/controllers/api/tokens.js#L38-#L75))
  - To see how it works, run the command `NODE_DEBUG=performance node index.js` in your terminal

# Cluster:

  - Added a new file with clusters, here forks are created by the count of the CPUs available ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/index-cluster.js))
  - To see how it works, run the command `node index-cluster.js` in your terminal

# Child Process:

  - Using `ls` commands into the `.logs` folder from CLI commands `list logs` ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/lib/cli-responders.js#L209-#L222))

# Other NodeJS Modules:

  - Use of Async Hooks module ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/misc/async-hooks/index.js))
  - Use of HTTP/2 module in Client & Server Logic ([View Code](https://github.com/faizahmedfarooqui/nodejs/tree/master/misc/http2))
  - Use of NET module in Client & Server Logic ([View Code](https://github.com/faizahmedfarooqui/nodejs/tree/master/misc/net))
  - Use of REPL module ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/misc/repl/index.js))
  - Use of TLS/SSL module in Client & Server Logic ([View Code](https://github.com/faizahmedfarooqui/nodejs/tree/master/misc/tls))
  - Use of UDP module in Client & Server Logic ([View Code](https://github.com/faizahmedfarooqui/nodejs/tree/master/misc/udp))
  - Use of VM module ([View Code](https://github.com/faizahmedfarooqui/nodejs/blob/master/misc/vm/index.js))

# How to download & setup?

```sh 
#
# You only need NodeJS (LTS) ie. >= 8.11.3
#

# Clone this repo using your terminal
git clone https://github.com/faizahmedfarooqui/nodejs.git;

# Go inside the repo
cd nodejs;

# Make a data directory into the root of the project
mkdir .data && cd .data;

# Create 3 more directories into the .data directory
mkdir users checks tokens;

# Go back to project's root 
cd ..;

# Make a logs directory into the root of the project
mkdir .logs;

# Goto the https directory
cd https;

# Now run the command given also available 
# in the file keyGeneration.txt
openssl req -newkey rsa:2048 -new -nodes -x509 \ 
 -days 3650 -keyout key.pem -out cert.pem;
``` 

### That's All! 

- - -

### # About Me 👨‍💻

I'm Faiz A. Farooqui. Software Engineer from Bengaluru, India.
Find out more about me @ https://faizahmed.in
