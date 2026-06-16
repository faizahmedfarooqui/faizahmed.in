---
title: "Metal to Cloud – Part 11: Access and Interaction"
datePublished: Thu Apr 17 2025 12:30:11 GMT+0000 (Coordinated Universal Time)
cuid: cm9lc8ws500010akz5wgzad0e
slug: metal-to-cloud-part-11-access-and-interaction
cover: ./cover.jpg
tags: metal-to-cloud, openstack, juju, maas
series: metal-to-cloud

---

Welcome back! In the last few posts, we've been deep in the engine room, deploying the OpenStack control plane (Part 6), Ceph storage (Part 7), Nova compute nodes (Part 8), OVN networking (Part 9), and additional services like LBaaS, DNSaaS, and RGW (Part 10).

The infrastructure is built, orchestrated by Juju on MaaS-provisioned hardware.

Now, it's time to put on our "cloud user" hat. We'll access the **Horizon dashboard**, OpenStack's web UI, and walk through the fundamental workflow of creating network resources and launching our very first VM. This will test and validate that all the components we've deployed are working together correctly.

## Accessing Horizon: The Front Door 🚪

The Horizon dashboard was deployed as the `openstack-dashboard` application back in Part 6, likely running in an LXD container on one of our control nodes (`i45`, `i46`, or `i47`). Crucially, it should be accessible via the High Availability VIP we configured for it in our `config.yaml`.

1. **Find the URL:** The URL is typically `http://<Horizon_VIP>/` or potentially `https://<Horizon_VIP>/` if TLS termination is configured at the VIP layer (often via HAProxy). From our `config.yaml`, the VIP is `10.3.1.206`. So, try accessing [`http://10.3.1.206/`](http://10.3.1.206/) in your web browser.
    
2. **Log In:** You'll be greeted by the OpenStack login screen. Use the Keystone admin credentials you set up (or potentially created via `juju run keystone/leader create-credential`). If you haven't explicitly set an admin password for Horizon access, you might need to check Keystone setup or default configurations used by the charm. *Alternatively, use the OpenStack CLI to create a dedicated demo user and project for testing.*
    

## Navigating the Dashboard (Quick Tour) 🧭

Once logged in, Horizon presents a comprehensive view of the cloud:

* **Overview/Usage Summary:** Shows resource consumption within the current project (tenant).
    
* **Compute:** Manage Instances (VMs), Images, Key Pairs, Flavors.
    
* **Network:** Manage Networks, Routers, Security Groups, Floating IPs.
    
* **Storage:** Manage Volumes (Cinder/Ceph) and potentially Object Storage (Swift/RGW).
    
* **Identity (Admin only):** Manage Projects, Users, Roles.
    
* **Admin Panel:** Provides cloud-wide views of Hypervisors, Flavors, Networks, System Info, etc.
    

Remember, every action you take in Horizon translates into an API call to the respective OpenStack service (Keystone, Nova, Neutron, Glance, Cinder...) that we deployed earlier!

## Pre-Flight Checks (Admin View) ✈️

Before launching a VM as a regular user, let's quickly verify some prerequisites from the Admin perspective:

1. **Images:** Navigate to `Admin -> Compute -> Images`. You should see the Ubuntu cloud images (Jammy, Noble, etc.) that were automatically synced via the `glance-simplestreams-sync` charm configuration. This confirms Glance is working and using its storage backend (Ceph in our case).
    
2. **Flavors:** Go to `Admin -> Compute -> Flavors`. Ensure some default VM sizes (e.g., `m1.small`, `m1.medium`) exist, or create a simple one (e.g., `m1.tiny`, 1 vCPU, 512MB RAM, 1GB disk). Flavors define the resources allocated to a VM.
    
3. **Hypervisors:** Go to `Admin -> Compute -> Hypervisors`. Verify that your compute nodes (deployed in Part 8) are listed, `State` is `up`, and `Status` is `enabled`. This confirms `nova-compute` is running and communicating with `nova-cloud-controller`.
    
4. **External Network:** Go to `Admin -> Network -> Networks`. Check that a network representing your external connectivity (our PUB network, likely associated with `physnet1` used in bridge mappings) exists and is marked appropriately (e.g., `External`).
    

## Launching Your First VM: The User Workflow 🚀

Let's simulate a typical user workflow within a specific project (e.g., `admin` or a separate `demo` project).

1. **Create Tenant Network:** Users need their own private network space.
    
    * Go to `Network -> Networks`.
        
    * Click `+ Create Network`.
        
    * **Network Tab:** Name: `private-net`. Click Next.
        
    * **Subnet Tab:** Subnet Name: `private-subnet`, Network Address: `192.168.100.0/24` (example), Gateway IP: `192.168.100.1`. Click Next.
        
    * **Subnet Details Tab:** Enable DHCP. Optionally add DNS servers. Click Create.
        
    * *Behind the Scenes:* Horizon calls Neutron API -&gt; OVN creates a logical switch and configures DHCP options.
        
2. **Create Router:** To connect the private network to the outside world (for Floating IPs or outbound NAT).
    
    * Go to `Network -> Routers`.
        
    * Click `+ Create Router`.
        
    * Name: `router1`. External Network: Select the external network (`physnet1` equivalent). Click Create Router.
        
    * **Add Interface:** Click on the newly created `router1`. Go to the `Interfaces` tab -&gt; `+ Add Interface`. Select the `private-subnet` from your `private-net`. IP Address (Optional): `192.168.100.1` (the gateway). Click Submit.
        
    * *Behind the Scenes:* Horizon calls Neutron API -&gt; OVN creates a logical router, links it to the external network, and connects it to your logical switch.
        
3. **Configure Security Group:** Control network access to VMs.
    
    * Go to `Network -> Security Groups`.
        
    * Select the `default` security group.
        
    * Go to the `Rules` tab -&gt; `+ Add Rule`.
        
    * Add an `Ingress` rule: Rule: `SSH` (or Custom TCP, Port 22), Remote: `CIDR`, CIDR: `0.0.0.0/0`. Click Add. *(Warning: Allows SSH from anywhere; restrict CIDR in production!)*.
        
    * *Behind the Scenes:* Neutron updates firewall rules, likely implemented via OVN ACLs or OVS flows.
        
4. **Add SSH Key Pair:** Needed to log into the VM.
    
    * Go to `Compute -> Key Pairs`.
        
    * Click `+ Create Key Pair` (generate a new one and save the private key) or `Import Public Key` (paste your existing public key). Give it a name (e.g., `my-key`).
        
5. **Launch Instance!**
    
    * Go to `Compute -> Instances`.
        
    * Click `Launch Instance`.
        
    * Fill out the dialog:
        
        * **Details Tab:** Instance Name: `test-vm-01`.
            
        * **Source Tab:** Select Boot Source: `Image`. Select an Ubuntu image (e.g., `ubuntu-22.04-minimal-cloudimg-amd64`). Leave 'Create New Volume' as 'No' (uses ephemeral storage).
            
        * **Flavor Tab:** Select a flavor (e.g., `m1.tiny` or `m1.small`).
            
        * **Networks Tab:** Drag `private-net` to 'Selected Networks'.
            
        * **Security Groups Tab:** Ensure `default` is selected.
            
        * **Key Pair Tab:** Select the key pair you added (`my-key`).
            
    * Click `Launch Instance`.
        
6. **Observe & Connect:**
    
    * Watch the `Instances` page. The VM status will go through `BUILD`, `SPAWNING`, eventually reaching `ACTIVE`.
        
    * *Behind the Scenes:* Horizon -&gt; Nova API -&gt; Placement -&gt; Nova Compute -&gt; Libvirt/KVM boots VM using Glance image (from Ceph), connects networking via OVN.
        
    * **Associate Floating IP:** Once `ACTIVE`, find your VM, click the Actions dropdown -&gt; `Associate Floating IP`.
        
        * Select an IP from the external pool (PUB network `103.x.x.x/24`) or click `+` to allocate a new one.
            
        * Select the VM's port (`private-net` IP).
            
        * Click `Associate`.
            
    * *Behind the Scenes:* Neutron -&gt; OVN configures NAT/routing rules via `br-ex` on the hypervisor/gateway.
        
    * **SSH Access:** Open your terminal:
        
        ```bash
        # Use the Floating IP and the private key matching the key pair added
        ssh -i /path/to/your/private_key ubuntu@<floating_ip_address>
        ```
        
        You should successfully connect to your first VM! 🎉
        
7. **Attach Volume (Bonus):**
    
    * Go to `Storage -> Volumes`. Click `+ Create Volume`. Name: `test-vol`, Size: 1 GB. Click Create Volume. (Uses Cinder -&gt; Ceph RBD).
        
    * Once `Available`, find the volume, Actions -&gt; `Manage Attachments`. Select your `test-vm-01`. Click Attach Volume. (Uses Nova -&gt; Cinder -&gt; Ceph).
        
    * Inside the VM, check `lsblk` to see the newly attached disk (e.g., `/dev/vdb`).
        

## Conclusion: It Works! ✅

Success! By navigating through Horizon, we performed standard cloud user tasks: created networks, routers, security rules, launched a VM from an image, assigned a Floating IP, connected via SSH, and even attached persistent block storage.

Crucially, each click in the UI triggered a cascade of API calls to the backend services (Keystone, Neutron, Nova, Glance, Cinder) which orchestrated actions across our MaaS-provisioned hardware, Ceph storage cluster, and OVN virtual network – all deployed and integrated using Juju. This end-to-end test validates the core functionality of our on-prem cloud.

With the fundamentals working, Part 12 will focus on visibility and optimization by deploying the OpenStack Telemetry stack (Ceilometer, Gnocchi, Aodh) and reviewing secrets management with Barbican.
