---
title: "Master Docker in Real Projects: Compose + CI/CD + Best Practices"
datePublished: Wed Jul 23 2025 08:52:37 GMT+0000 (Coordinated Universal Time)
cuid: cmdfq6qbv002n02l1eeasf3fy
slug: master-docker-compose-cicd
cover: ./cover.jpg
tags: postgresql, software-engineering, docker, nodejs, web-development, devops, containers, ci-cd, phpmyadmin, docker-compose, github-actions-1, backend-engineering
series: vcw

---

With real-world Docker Compose setups, GitHub Actions CI pipelines, and practical command recipes.

> Everything you need to master Docker to Compose & CI/CD pipelines — from dev to deployment — in one place.

# Docker Fundamentals

Whether you're debugging a container, cleaning up images, or building complex multi-stage setups, this is your one-stop command reference.

## Getting Started with Docker

### Check Docker Version

```bash
docker --version
docker version
```

### Check Docker Info

```bash
docker info
```

## Working with Images

### Pull an Image

```bash
docker pull ubuntu:22.04
```

### List Images

```bash
docker images
```

### Remove Image

```bash
docker rmi ubuntu:22.04
```

### Build Image from Dockerfile

```bash
docker build -t my-app-image .
```

### Tag Image

```bash
docker tag my-app-image myrepo/my-app-image:latest
```

### Push Image to Registry

```bash
docker push myrepo/my-app-image:latest
```

## Working with Containers

### Run Container

```bash
docker run -it ubuntu /bin/bash
docker run --name mycontainer -d nginx
```

### List Running Containers

```bash
docker ps
```

### List All Containers (including stopped)

```bash
docker ps -a
```

### Stop Container

```bash
docker stop mycontainer
```

### Start Container

```bash
docker start mycontainer
```

### Remove Container

```bash
docker rm mycontainer
```

## Debugging & Logs

### View Logs of a Container

```bash
docker logs mycontainer
```

### Attach to a Running Container

```bash
docker attach mycontainer
```

### Exec into a Running Container

```bash
docker exec -it mycontainer /bin/bash
```

## Cleaning Up

### Remove All Stopped Containers

```bash
docker container prune
```

### Remove All Unused Images

```bash
docker image prune
```

### Remove Everything (Careful!)

```bash
docker system prune -a
```

## Networking

### List Networks

```bash
docker network ls
```

### Create Network

```bash
docker network create my-network
```

### Run Container with Network

```bash
docker run --network=my-network nginx
```

## Volumes & Persistence

### List Volumes

```bash
docker volume ls
```

### Create Volume

```bash
docker volume create my-volume
```

### Run with Volume

```bash
docker run -v my-volume:/app/data nginx
```

### Bind Mount Local Directory

```bash
docker run -v $(pwd)/config:/app/config nginx
```

## Advanced Usage

### Multi-Stage Build (Dockerfile)

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Build with Build Args

```bash
docker build --build-arg VERSION=1.0 -t myapp .
```

## Monitoring & Stats

### View Container Stats

```bash
docker stats
```

### Inspect Container

```bash
docker inspect mycontainer
```

## TL;DR: Most Useful Everyday Commands

```bash
docker ps -a              # List all containers
docker images             # List all images
docker logs <id>          # Logs from container
docker exec -it <id> bash # Shell into container
docker rm <id>            # Remove container
docker rmi <id>           # Remove image
```

# From Docker to Compose

> Now we are going for Scaling Multi-Container Apps…!

## What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications. You define services, networks, and volumes in a single YAML file (`docker-compose.yml`).

It simplifies local development, staging, testing, and even production deployments for small- to mid-size apps.

## Basic `docker-compose.yml` Structure

```yaml
docker-compose.yml

version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
  redis:
    image: redis:alpine
```

### Key Options —

* **build**: Context for Dockerfile

* **ports**: Map host:container ports

* **environment**: Inject ENV vars

* **volumes**: Sync host and container files


## Real-World Docker Compose Examples

### 1\. **Node.js App + MongoDB**

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    depends_on:
      - mongo
  mongo:
    image: mongo
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data:
```

### 2\. **Next.js + Redis + MySQL + Nginx + PHPMyAdmin**

```yaml
version: '3.9'

services:
  app:
    build: ./app
    ports:
      - "3000:3000"
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: myapp
    volumes:
      - mysql_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    ports:
      - "8081:80"
    environment:
      PMA_HOST: db
      MYSQL_ROOT_PASSWORD: root
    depends_on:
      - db

  nginx:
    image: nginx
    ports:
      - "8080:80"

volumes:
  mysql_data:
```

## Useful Commands

```bash
# Start all services
docker-compose up

# Rebuild on changes
docker-compose up --build

# Start in background (detached mode)
docker-compose up -d

# Stop all services
docker-compose down

# List running containers
docker-compose ps

# Run a one-off command
docker-compose exec web sh
```

# CI/CD with Docker

## Using GitHub Actions Example

Let’s automate builds + tests with GitHub Actions.

### 📁 `.github/workflows/docker.yml`

```yaml
name: Docker CI
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up Docker
      uses: docker/setup-buildx-action@v2

    - name: Build Docker image
      run: docker build -t myapp .

    - name: Run tests
      run: docker run myapp npm test
```

# CI/CD with Docker Compose

## In GitHub Actions

```yaml
name: Docker Compose CI
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      docker:
        image: docker:20.10.16

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Compose
      run: |
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose

    - name: Run Integration Tests
      run: |
        docker-compose up -d
        docker-compose exec web npm test
```

## Bonus: Secrets in Docker Compose

```yaml
  environment:
    - DB_PASSWORD=${DB_PASSWORD}
```

Set in `.env` file or CI/CD secrets manager.

## Best Practices Recap

| **Area** | **Tip** |
| --- | --- |
| **Build Caching** | Use `.dockerignore` + multistage builds |
| **Secrets** | Avoid hardcoding in YAML, use ENV or secrets manager |
| **Clean Up** | `docker-compose down -v` to remove volumes too |
| **Logs** | Use `docker-compose logs -f` for debugging |
| **Healthchecks** | Add to services for better orchestration |
