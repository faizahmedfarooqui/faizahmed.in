---
title: "Traefik Postgres pgAdmin: A Simple (But Complete) Guide"
datePublished: Tue Nov 29 2022 03:30:44 GMT+0000 (Coordinated Universal Time)
cuid: clb1nw2b701c2iynvh24q4ipl
slug: traefik-postgres-pgadmin
cover: ./cover.jpg
tags: traefik, postgresql, pgadmin, docker, docker-compose
series: treafik

---

# Introduction

In this post, I'll demonstrate how to include Traefik Proxy — a cloud native application proxy — in our Docker Compose file and use it in our architecture with PostgreSQL and pgAdmin service containers.

I've previously covered Traefik's principles in prior blogs —

* [How much do you know "Traefik" proxy?](/how-much-do-you-know-traefik-proxy)
    
* [Traefik + Docker Compose](/traefik-docker-compose)
    

As a baseline, I'm assuming you're familiar with [Docker](https://docs.docker.com/desktop/), [Docker Compose](https://docs.docker.com/compose/) & [Traefik](/how-much-do-you-know-traefik-proxy).

Let's get started —

I'll share the Docker Compose file, followed by a full analysis of what every line in our template represents.

# Docker Compose

```yml
version: "3.6"
services:
  traefik:
    image: traefik:v2.9
    container_name: traefik
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --log.level=debug
      - --entrypoints.web.address=:1337
    ports:
      - 1337:1337
      - 9090:8080
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  postgres:
    container_name: pg_container
    image: postgres:12
    restart: always
    depends_on:
      - traefik
    ports:
      - 5432:5432
    volumes:
      - ./postgres-data/:/var/lib/postgresql/data/
      # - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 87654321
      POSTGRES_DB: testing
    healthcheck:
      test:
        - CMD-SHELL
        - psql -U postgres -d testing
      interval: 10s
      timeout: 10s
      retries: 50
      start_period: 30s

  pgadmin:
    image: dpage/pgadmin4
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./pgadmin-data:/var/lib/pgadmin
    ports:
      - 5050:80
    environment:
      PGADMIN_DEFAULT_EMAIL: faiz@admin.com
      PGADMIN_DEFAULT_PASSWORD: 123456
      SCRIPT_NAME: /_admin/pgadmin
    labels:
      - traefik.enable=true
      - traefik.http.routers.pgadmin.entrypoints=web
      - traefik.http.routers.pgadmin.service=pgadmin
      - traefik.http.services.pgadmin.loadbalancer.server.port=80
      - traefik.http.routers.pgadmin.rule=(Host(`localhost`) && PathPrefix(`/_admin/pgadmin`))
```

# Details (of the content mentioned in Docker Compose file)

* Replace `localhost` with your own domain or sub-domain in `traefik`, `postgres` & `pgadmin` services
    
* Change config vars against these environment vars in `postgres` service — `POSTGRES_USER`, `POSTGRES_PASSWORD` & `POSTGRES_DB`
    
* Change config vars against these environment vars in `pgadmin` service — `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` & `SCRIPT_NAME`
    
* Run `docker-compose.yml` file by using the command `docker-compose up -d`
    
* Your pgAdmin server should be up and running. Visiting [http://localhost:1337/\_admin/pgadmin](http://localhost:1337/_admin/pgadmin), will show you your pgAdmin portal
    
* You'll need to **register a server** in `pgAdmin` after you successfully login into it with the configs values you used in your `docker-compose.yml` file - just remember to use `pg_container` as the hostname
    
* I'm using official docker images for [PostgreSQL](https://hub.docker.com/_/postgres) & [pgAdmin](https://hub.docker.com/r/dpage/pgadmin4)
    

## Analysing PostgreSQL service

```yml
  postgres:
    container_name: pg_container
    image: postgres:12
    restart: always
    depends_on:
      - traefik
    ports:
      - 5432:5432
    volumes:
      - ./postgres-data/:/var/lib/postgresql/data/
      # - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 87654321
      POSTGRES_DB: testing
    healthcheck:
      test:
        - CMD-SHELL
        - psql -U postgres -d testing
      interval: 10s
      timeout: 10s
      retries: 50
      start_period: 30s
```

* The **container name** is your **database hostname**, from our template the database hostname is `pg_container`
    
* `depends_on: [traefik]` means we want to wait till `traefik` service is up
    
* `ports` exposes our postgres to accept incoming requests with the postgres port running inside your docker container
    
* `volumes` mapping helps us to keep our data within the database to **persist** in our **local machine**. So, next time when we run our docker-compose from the same location - persisted data from the directory `./postgres-data` will be utilised by our postgres service container and it won't redo all the installation steps
    
* In `volumes`, you see I have commented out this line — `# - ./init.sql:/docker-entrypoint-initdb.d/init.sql`
    
    * If you would like to do additional **initialization** in an image derived from this one, add one or more `*.sql`, `*.sql.gz`, or `*.sh` scripts under `/docker-entrypoint-initdb.d` (creating the directory if necessary)
        
    * After the entrypoint calls **initdb** to create the default postgres user and database, it will run any `*.sql` files, run any executable `*.sh` scripts, and source any non-executable `*.sh` scripts found in that directory to do further **initialization** before starting the service
        
    * **Warning**: scripts in `/docker-entrypoint-initdb.d` are only run **if you start the container with a data directory that is empty**; any **pre-existing database** will be left untouched on container startup
        
    * One common problem is that if one of your `/docker-entrypoint-initdb.d` scripts **fails** (which will cause the entrypoint script to exit) and your orchestrator restarts the container with the already initialized data directory, **it will not continue on with your scripts**
        
* There are lots of other environment vars available in postgres docker image, you can find their references here - [postgres](https://hub.docker.com/_/postgres)
    
* I do `healthcheck` with **postgres** container because it takes almost a minute to initialise for the first time and starts accepting connection requests once postgres container is up & this might break my backend apps which would need database connection in their start scripts
    
* You can find **healthcheck** references from the [docker-compose's official documentation](https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck)
    

## Analysing pgAdmin service

```yml
  pgadmin:
    image: dpage/pgadmin4
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./pgadmin-data:/var/lib/pgadmin
    ports:
      - 5050:80
    environment:
      PGADMIN_DEFAULT_EMAIL: faiz@admin.com
      PGADMIN_DEFAULT_PASSWORD: 123456
      SCRIPT_NAME: /_admin/pgadmin
    labels:
      - traefik.enable=true
      - traefik.http.routers.pgadmin.entrypoints=web
      - traefik.http.routers.pgadmin.service=pgadmin
      - traefik.http.services.pgadmin.loadbalancer.server.port=80
      - traefik.http.routers.pgadmin.rule=(Host(`localhost`) && PathPrefix(`/_admin/pgadmin`))
```

* `depends_on: postgres` This statement means that `pgAdmin` service depends on `postgres` and waits until the **healthy** service status is received from the same container and this is how one should use the `postgres` **depends** in their backend app services as well.
    
* If not done as above, your backend will definitely fail most of the times which is not good for your final product
    
* Almost all of the configs speaks for itself except env var `SCRIPT_NAME`
    
* Since I have `traefik` - I wanted to host my **pgAdmin** app on some route & here's how it's done
    
    * Firstly, to do this I had to move **pgadmin** on some route & you can do it by setting the `SCRIPT_NAME` variable
        
    * Once that's done, now rewriting routes uri using **traefik** labels to `/_admin/pgadmin` will do the job
        

Thank You!

# Summary

After reading this article, you will have a fundamental grasp on how to setup **Traefik Proxy** with **PostgreSQL** and **pgAdmin** in your Docker Compose.

And I strongly advise everyone to have the "health check" docker-compose's index in your postgres service container to avoid unnecessary initialisation failures.

---
