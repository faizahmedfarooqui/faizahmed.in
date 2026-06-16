---
title: "Metal to Cloud – Part 9: Weaving the Virtual Network Fabric"
datePublished: Tue Apr 15 2025 12:30:50 GMT+0000 (Coordinated Universal Time)
cuid: cm9ihe0v6000109k1gb8dhqaa
slug: part-9-weaving-the-virtual-network-fabric
cover: ./cover.jpg
tags: ovn-chassis, br-ex, openstack, metal-to-cloud, maas, juju
series: metal-to-cloud

---

In Part 8, we deployed the `nova-compute` service, giving our cloud the ability to run VMs.

However, those compute nodes and the VMs they host are still effectively isolated. We need a robust and flexible networking layer to connect everything – allowing VMs to talk to each other, access storage, and reach the outside world.

This is where Neutron (OpenStack's networking service) and its powerful backend, OVN (Open Virtual Network), come in, orchestrated by Juju.

## Why SDN and OVN? 🤔

Traditional networking using only VLANs can become complex and limiting in a cloud environment, especially with many tenants needing isolated networks (the 4094 VLAN limit can be a real constraint!). Software-Defined Networking (SDN) offers a more scalable and automated approach:

* **Centralized Control:** Network logic is managed centrally, not on individual switches.
    
* **Automation:** Network creation and policy enforcement are driven by software (Neutron API).
    
* **Network Virtualization:** Creates virtual networks (often using overlay protocols like Geneve or VXLAN) that are independent of the underlying physical network fabric.
    

**OVN (Open Virtual Network)** is a mature, feature-rich SDN solution built on top of Open vSwitch (OVS). It's designed for cloud environments and integrates tightly with OpenStack Neutron, providing logical switches, routers, security groups, DHCP, and more.

## OVN Architecture Basics 🏗️

OVN has two main parts:

1. **Central Components (**`ovn-central` charm\*\*)\*\*:
    
    * **Northbound Database (NB DB):** Stores the desired logical network configuration (switches, routers, ACLs) as defined by Neutron.
        
    * **Southbound Database (SB DB):** Stores translated logical flows and physical network information.
        
    * `ovn-northd`: Translates the logical configuration from the NB DB into logical flows in the SB DB.
        
    * *Runs centrally*, typically in HA mode (on our `os-misc` nodes `5, 6, 7` in LXD).
        
2. **Chassis Components (**`ovn-chassis` charm\*\*)\*\*:
    
    * Runs on each **hypervisor** (`nova-compute` nodes) and any dedicated network gateways.
        
    * `ovn-controller`: Connects to the SB DB, retrieves relevant logical flows, and translates them into actual OpenFlow rules for the local Open vSwitch instance.
        
    * **Open vSwitch (**`ovs-vswitchd`, `ovsdb-server`): The virtual switch that handles packet forwarding based on the flows programmed by `ovn-controller`.
        

```mermaid
graph TD
    subgraph "OVN Architecture"
        Neutron(Neutron API);
        Central(ovn-central<br>NB DB, SB DB, ovn-northd);

        subgraph Hypervisor1 [Hypervisor Node 1]
            OVS1(Open vSwitch);
            Chassis1(ovn-chassis<br>ovn-controller);
            VM1(VM 1);
        end
        subgraph Hypervisor2 [Hypervisor Node 2]
            OVS2(Open vSwitch);
            Chassis2(ovn-chassis<br>ovn-controller);
            VM2(VM 2);
        end

        Neutron -- Writes Logical Config --> Central;
        Central -- Pushes Logical Flows --> Chassis1;
        Central -- Pushes Logical Flows --> Chassis2;
        Chassis1 -- Programs Flows --> OVS1;
        Chassis2 -- Programs Flows --> OVS2;
        VM1 -- Connects to --> OVS1;
        VM2 -- Connects to --> OVS2;
        OVS1 <-- Overlay Tunnel --> OVS2;

    end
```

## Configuring `br-ex` Before Juju Deployment

To ensure seamless integration of OpenStack applications such as OVN-Chassis, it's crucial to properly configure the external bridge (`br-ex`) on your MAAS-managed machines.

This step should be performed immediately after the machine is commissioned in MAAS and marked as "Ready" but **before** you deploy it via Juju.

### ⚠️ Important Prerequisite

Ensure the machine status in MAAS is **"Ready" (commissioned but not yet deployed)**.

### 🧵 Step-by-Step `br-ex` Configuration in MAAS

1. **Navigate to MAAS UI**:
    
    * Go to the **Machines** tab.
        
    * Select your commissioned machine ready for deployment.
        
2. **Access Network Interfaces**:
    
    * Click on the **Network** tab to manage interfaces.
        
3. **Configure the External Bridge (**`br-ex`**)**:
    
    * Identify the physical network interface connected to your external network (e.g., `enp1s0`).
        
    * Select the checkbox next to the relevant physical interface.
        
    * Click on **Actions → Create bridge**.
        
    * In the configuration modal:
        
        * Enter `br-ex` as the **Bridge name**.
            
        * Select **Open vSwitch** for the bridge type.
            
        * Confirm that your external physical interface (e.g., `enp1s0`) is listed and selected.
            
        * Configure the bridge IP addressing according to your network requirements (static IP or DHCP).
            
    * Click **Save interface**.
        
4. **Confirm Network Settings**:
    
    * Verify the configuration under the Network tab. Confirm that `br-ex` is correctly associated with your physical external interface.
        
5. **Deploy Machine via Juju**:
    
    * With `br-ex` configured and verified, proceed to deploy the machine using Juju.
        

### ✅ Post-Deployment Verification

After deploying via Juju:

* Ensure the bridge exists: `ip a | grep br-ex`
    
* Check Open vSwitch bridge: `ovs-vsctl show`
    

This proactive approach guarantees the availability of `br-ex` for Juju-managed OpenStack services such as Octavia, simplifying network setup and ensuring reliable external connectivity.

## Deploying OVN with Juju 🛠️

Let's deploy the OVN components and integrate them with Neutron and Nova.

1. **Deploy OVN Central (HA):** Runs in LXD on our control plane nodes.
    
    ```bash
    juju deploy -n 3 --to lxd:5,lxd:6,lxd:7 --channel 23.09/stable ovn-central
    # Integrate with Vault for TLS certificates
    juju integrate ovn-central:certificates vault:certificates
    ```
    
2. **Deploy & Integrate Neutron OVN Plugin:** This subordinate charm links Neutron API to OVN.
    
    ```bash
    juju deploy --channel 2023.2/stable neutron-api-plugin-ovn
    # Integrate with Neutron API
    juju integrate neutron-api-plugin-ovn:neutron-plugin neutron-api:neutron-plugin-api-subordinate
    # Integrate with OVN Central database
    juju integrate neutron-api-plugin-ovn:ovsdb-cms ovn-central:ovsdb-cms
    ```
    
3. **Deploy & Configure OVN Chassis:** This subordinate runs on the hypervisors (alongside `nova-compute`) and manages the local Open vSwitch (OVS) instance to implement the virtual networks.
    
    ```bash
    # Deploy using config from neutron.yaml (contains bridge mappings)
    juju deploy --channel 23.09/stable --config neutron.yaml ovn-chassis
    ```
    
    **Connecting Virtual to Physical (Bridge Mappings):** A critical piece of configuration applied to `ovn-chassis` (via our `neutron.yaml` or main `config.yaml`) tells OVN how to connect the virtual network to your physical network (our PUB network) for things like Floating IPs and external access. We configure two key options:
    
    * `bridge-interface-mappings`: We set this to `br-ex:eno2`. This essentially links a specific physical network card on the compute node (`eno2` in our case) to an Open vSwitch bridge named `br-ex`.
        
    * `ovn-bridge-mappings`: We set this to `physnet1:br-ex`. This tells Neutron and OVN that the logical "provider network" (which we've named `physnet1`) should use the `br-ex` OVS bridge to reach the physical network.
        
    
    You don't need to create the `br-ex` OVS bridge manually.
    
    The `ovn-chassis` Juju charm (along with its dependencies) automatically handles installing Open vSwitch, creating the necessary bridges (`br-ex`, `br-int`), and connecting the specified physical NIC (`eno2`) based on this configuration.
    
    This ensures the crucial link between the virtual and physical networks is correctly established via Juju automation.
    
    **Integrate OVN Chassis:** Now, connect the chassis to the central components and the compute service:
    
    ```bash
    # Integrate chassis with OVN Central database
    juju integrate ovn-chassis:ovsdb ovn-central:ovsdb
    # Integrate chassis with Nova Compute (telling Nova how networking works)
    juju integrate ovn-chassis:nova-compute nova-compute:neutron-plugin
    # Integrate with Vault for TLS certificates
    juju integrate ovn-chassis:certificates vault:certificates
    ```
    
4. **Deploy Nova Cell Controller:** This component helps manage communication within a Nova compute cell, especially important for networking and other interactions. We deploy it HA in LXD containers.
    
    ```bash
    juju deploy -n 3 --to lxd:5,lxd:6,lxd:7 nova-cell-controller --channel 2023.2/stable
    juju deploy --channel 8.0/stable mysql-router nova-cell-controller-mysql-router
    
    # Integrate Nova Cell Controller
    juju integrate nova-cell-controller-mysql-router:db-router mysql-innodb-cluster:db-router
    juju integrate nova-cell-controller-mysql-router:shared-db nova-cell-controller:shared-db
    juju integrate nova-cloud-controller:nova-cell nova-cell-controller:nova-cell # Link to main controller
    juju integrate rabbitmq-server:amqp nova-cell-controller:amqp # Link to MQ
    juju integrate vault:certificates nova-cell-controller:certificates # Link to Vault
    juju integrate keystone:identity-credentials nova-cell-controller:identity-credentials
    juju integrate keystone:identity-service nova-cell-controller:identity-service
    juju integrate nova-compute:nova-cell nova-cell-controller:nova-cell # Link compute nodes
    ```
    
5. **Configure Neutron Provider Network:** Ensure Neutron API knows about `physnet1` which we mapped via `ovn-chassis`. This might already be set via the main `config.yaml`/`neutron.yaml` used during `neutron-api` deployment.
    
    ```bash
    # Verify or set the flat network provider config
    # juju config neutron-api flat-network-providers # Check current value
    juju config neutron-api flat-network-providers=physnet1
    # Also ensure other relevant Neutron ML2 settings are correct (port security, qos etc)
    # juju config neutron-api enable-ml2-port-security=true enable-qos=true
    ```
    

## Verification ✅

After the deployments and integrations settle (`juju status`), things should be connected.

* **Check OVN:**
    
    ```bash
    juju run ovn-central/leader 'ovn-sbctl show'
    # Look for Chassis entries corresponding to your compute nodes.
    ```
    
* **Check Neutron Agents:**
    
    ```bash
    juju run neutron-api/leader 'openstack network agent list'
    # You should see OVN related agents listed and 'UP'.
    ```
    

## Conclusion 🕸️

The virtual network fabric is now woven!

By deploying OVN Central, integrating it with Neutron via the plugin, and deploying OVN Chassis to our compute nodes (configured with the crucial bridge mappings, handled by the charm), we've established our SDN foundation. We also deployed the `nova-cell-controller` to facilitate communication.

Our compute nodes are now fully integrated participants in the virtual network, capable of hosting VMs that can communicate securely and potentially reach the external network via `physnet1`.

In Part 10, we'll enhance our network capabilities further by adding Load Balancer as a Service (Octavia) and DNS as a Service (Designate) using Juju.
