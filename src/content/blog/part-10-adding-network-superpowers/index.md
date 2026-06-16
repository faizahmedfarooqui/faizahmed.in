---
title: "Metal to Cloud – Part 10: Adding Network Superpowers"
datePublished: Wed Apr 16 2025 12:30:17 GMT+0000 (Coordinated Universal Time)
cuid: cm9jwt6k3002x09jo68aqfyq7
slug: part-10-adding-network-superpowers
cover: ./cover.jpg
tags: metal-to-cloud, maas, openstack, juju
series: metal-to-cloud

---

In Part 9, we successfully deployed OVN, establishing the Software-Defined Networking (SDN) layer for our OpenStack cloud.

Our virtual machines can now communicate seamlessly; however, modern cloud infrastructures demand more than basic connectivity.

Users expect advanced features such as load balancing, automated DNS management, and object storage.

In this post, we will enhance our OpenStack environment by adding:

* **Octavia** for Load Balancer as a Service (LBaaS)
    
* **Designate** for DNS as a Service (DNSaaS)
    
* **Ceph RadosGW** for S3/Swift-compatible Object Storage
    

## Why LBaaS and DNSaaS?

* **LBaaS (Octavia)**: Load balancing distributes incoming traffic across multiple VM instances, enhancing application scalability and reliability. Octavia automates this by spinning up dedicated VMs (amphorae) running HAProxy.
    
* **DNSaaS (Designate)**: Automated DNS management simplifies handling of DNS records, integrating seamlessly with OpenStack to automatically manage DNS zones and records for your cloud resources.
    

## Deploying Octavia: Reliable Load Balancers

Octavia requires direct network access via bridges like `br-ex`. Hence, it should be deployed on physical machines or dedicated VMs—not LXD containers—to ensure proper network bridging.

**Deployment Strategy:**

```bash
# Deploy Octavia on physical machines (assuming HA setup)
juju deploy -n 3 --to 5,6,7 --channel 2023.2/stable octavia --config octavia.yaml

# Deploy MySQL Router for Octavia
juju deploy --channel 8.0/stable mysql-router octavia-mysql-router
```

### Amphora Image Preparation

Octavia requires a specialized Amphora VM image uploaded to Glance:

```bash
juju deploy --channel 2023.2/stable octavia-diskimage-retrofit
juju config octavia-diskimage-retrofit amp-image-tag=octavia-amphora
juju integrate octavia-diskimage-retrofit:glance glance:juju-info
```

Ensure a suitable Ubuntu Cloud base image is already present in Glance.

### Integrations

Integrate Octavia services with core components:

```bash
juju integrate octavia-mysql-router:db-router mysql-innodb-cluster:db-router
juju integrate octavia-mysql-router:shared-db octavia:shared-db
juju integrate octavia:identity-service keystone:identity-service
juju integrate octavia:amqp rabbitmq-server:amqp
juju integrate octavia:certificates vault:certificates
juju integrate octavia:neutron neutron-api:neutron-load-balancer
```

## Deploying Designate: Automated DNS Management

Designate and its backend (BIND) can safely be deployed into LXD containers, as they don't require special networking like Octavia.

```bash
# Designate API (HA deployment)
juju deploy -n 2 --to lxd:5,lxd:6 --channel 2023.2/stable --config designate.yaml designate
juju deploy --channel 8.0/stable mysql-router designate-mysql-router

# BIND backend for DNS
juju deploy -n 2 --to lxd:5,lxd:6 --channel yoga/stable designate-bind
```

Configure authoritative nameservers:

```bash
juju config designate nameservers='ns1.example.com. ns2.example.com.'
```

### Integrations

Integrate Designate with core OpenStack services:

```bash
juju integrate designate-mysql-router:db-router mysql-innodb-cluster:db-router
juju integrate designate-mysql-router:shared-db designate:shared-db
juju integrate designate:identity-service keystone:identity-service
juju integrate designate:amqp rabbitmq-server:amqp
juju integrate designate:certificates vault:certificates
juju integrate designate:dns-backend designate-bind:dns-backend
```

## Deploying Ceph RadosGW: S3/Swift Object Storage Gateway

Ceph RadosGW provides S3/Swift-compatible object storage and can be deployed in an LXD container (for basic or development setups). For production, consider multiple instances behind a load balancer.

```bash
juju deploy --to lxd:6 --channel quincy/stable --config ceph-rgw.yaml ceph-radosgw
```

### Integrations

Connect RadosGW to Ceph and Keystone:

```bash
juju integrate ceph-radosgw:mon ceph-mon:radosgw
juju integrate ceph-radosgw:identity-service keystone:identity-service
```

## Verification

Confirm the status and health of deployed services:

```bash
juju status octavia designate designate-bind ceph-radosgw
juju run keystone/leader 'openstack service list'
```

Ensure all services (`octavia`, `designate`, and `swift/s3`) appear active and integrated.

## Conclusion

Our OpenStack deployment now provides powerful, user-friendly "as-a-Service" functionalities:

* **Octavia** for robust load balancing.
    
* **Designate** for seamless automated DNS management.
    
* **Ceph RadosGW** for secure and flexible object storage access.
    

Next, we'll explore interacting with our cloud through the Horizon dashboard, deploying our first VMs, and validating our complete setup.
