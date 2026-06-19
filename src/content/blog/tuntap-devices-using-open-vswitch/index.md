---
title: "Open vSwitch: Create TunTap Devices"
datePublished: Mon Sep 25 2023 09:05:28 GMT+0000 (Coordinated Universal Time)
cuid: clmyny2s1000t09mh7907dair
slug: tuntap-devices-using-open-vswitch
cover: ./cover.jpg
tags: openvswitch, networking, tuntap
series: vcw

---

Open vSwitch (OVS) is a multi-layer software switch designed to enable massive network automation and programmability while providing support for standard management protocols.

Apart from its extensive feature set, one of the key advantages of OVS is its support for networking tunnelling protocols, a use case that is widely employed in software-defined networking (SDN) deployments.

In this regard, we will introduce you to the Tun/Tap network devices, which are a key feature of the Linux kernel and are used for creating network bridges. Specifically, this article will guide you on how to create TunTap devices using an Open vSwitch (OVS) bridge and allocate static IPs to the virtual ports.

## Creating TunTap Devices

TunTap devices are software network interfaces provided by the Linux kernel. They can be created and managed just like physical network interfaces.

### Create Bridge

```bash
ovs-vsctl add-br br0
```

### Create Network Interface

```bash
ovs-vsctl add-port br0 vSwitch0
ovs-vstl set Interface vSwitch0 type=internal
```

We have two commands above, the first command adds `vSwitch0` to the `br0` bridge and the second command sets `internal` type to the `vSwitch0` interface.

### Add the Physical Network Interface to the Bridge

```bash
ovs-vsctl add-port br0 eno1
```

Traffic will now flow between the physical network interface and the Open vSwitch bridge. Remember to change `eno1` with your Physical Network Interface.

### Create TunTap device

```bash
ip tuntap add mode tap vport0
```

### Attach TunTap to Bridge

```bash
ovs-vsctl add-port br0 vport0
```

You should now have a tap device called `vport0` which is part of the `br0` OVS bridge.

## Allocating Static IP Addresses

Static IP addressing, as opposed to dynamic addressing, is when a device keeps the same IP address every time it connects to the network.

### Assign Gateway IP to Bridge's Internal Switch

To assign a Gateway IP address to internal Switch, perform the following steps:

```bash
ip addr add 172.168.1.1/24 dev vSwitch0
```

`/24` is a netmask.

### Assign Static IP to TunTap device

To assign a static IP address to your newly created `vport0` interface, perform the following steps:

Remove the current IP from the device (if any):

```bash
ip addr flush dev vport0
```

Now, you can assign a new IP address. The following command will assign IP 172.168.1.100 to `vport0`:

```bash
ip addr add 172.168.1.100 dev vport0
```

## Up all the Interfaces and TunTaps

```bash
ip link set dev vSwitch0 up
ip link set dev vport0 up
```

These two commands will up all your interfaces. You can verify the same by running `ifconfig` command.

## IP Forwarding & NAT Configuration

### Enable IP Forwarding on the Host

IP forwarding is the ability for an operating system to accept incoming network packets on one interface, recognize that it is not meant for the system itself, but that it should be passed on to another network, and then forwards it accordingly.

```bash
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
```

### Make NAT Configuration for Internt Access

You can use a NAT device to allow resources in private subnets to connect to the internet, other VPCs, or on-premises networks. These instances can communicate with services outside the VPC, but they cannot receive unsolicited connection requests.

```bash
iptables -t nat -A POSTROUTING -o eno1 -j MASQUERAGE
iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i vSwitch0 -o eno1 -j ACCEPT
```

Traffic will now flow between the physical network interface and the Open vSwitch bridge. Remember to change `eno1` with your Physical Network Interface.

## Conclusion

This guide has walked you through the process of creating TunTap devices using OVS bridge and assigning static IPs to the virtual ports on Ubuntu 20.04.

With this knowledge, you can effectively set up and manage virtual network interfaces in your environment.

Please remember that, as with all things, practice furthers understanding. So, feel free to experiment with different configurations to fully comprehend the flexible nature of Open vSwitch.

Stay tuned for more insightful articles on advanced networking with Open vSwitch!

---

# **About Me 👨‍💻**

I'm Faiz A. Farooqui. Software Engineer from Bengaluru, India.  
Find out more about me @ [**faizahmed.in**](http://faizahmed.in)
