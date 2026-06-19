---
title: "Open vSwitch Configure: A Step-by-Step Guide"
datePublished: Sat Sep 23 2023 18:30:00 GMT+0000 (Coordinated Universal Time)
cuid: clmymmzb3000009jw1aoge2mg
slug: open-vswitch-configure
cover: ./cover.jpg
tags: linux, networking, openvswitch
series: vcw

---

## Introduction

Understanding the vast array of features and capabilities that Open vSwitch (OVS) offers is only half the battle; properly implementing them in your network architecture is the other.

The previous article served as a guide to installing OVS. Building on that, this guide will demonstrate how to initialize and utilize Open vSwitch on Ubuntu 20.04 using ovs-ctl.

OVS-ctl is a controller program that is designed to manage Open vSwitch daemons. It works by internally calling system startup scripts and should not typically be invoked directly by system administrators.

### Initialization and Usage Steps

#### Start Open vSwitch

The simplest way to start OVS in Ubuntu 20.04 is to run the following command:

```bash
ovs-ctl --system-id=random start
```

This command starts Open vSwitch and performs several tasks such as loading the Open vSwitch kernel module, creating a new database file if it doesn't exist, starts `ovsdb-server` if it's not already running and initializes some values in the database.

#### Stop Open vSwitch

OVS can be easily stopped in Ubuntu by running the following command:

```bash
ovs-ctl stop
```

This command stops the `ovs-vswitchd` and `ovsdb-server` daemons, but it does not unload the Open vSwitch kernel modules. If the OVS daemons aren’t running, this command will simply do nothing and complete successfully.

#### Restart Open vSwitch

The `restart` command is used to perform a stop followed by a start command. This can be performed using the following command:

```bash
ovs-ctl --system-id=random restart
```

This command also has the benefit of saving and restoring OpenFlow flows for each individual bridge.

#### Check Open vSwitch Status

If you want to verify whether the Open vSwitch daemons `ovs-vswitchd` and `ovsdb-server` are running, you can use the `status` command as follows:

```bash
ovs-ctl status
```

This command prints messages that inform you of the daemons' statuses.

#### Check Open vSwitch Version

You can confirm the version of your Open vSwitch by running:

```bash
ovs-ctl version
```

This command runs `ovsdb-server --version` and `ovs-vswitchd --version` and displays the results.

#### Enable a Protocol

If you want to enable a protocol in the system iptable configuration, `enable-protocol` command can be used. This command checks for rules related to a specified protocol in the system’s iptables configuration. If there are no rules specifically related to that protocol, then it inserts a rule to accept the specified protocol:

```bash
ovs-ctl --protocol=<protocol> enable-protocol
```

Replace `<protocol>` with the name of the IP protocol to be enabled. If no protocol is explicitly stated, the command defaults to enabling the `gre` protocol.

## Conclusion

Open vSwitch is a crucial part of modern networking, offering a robust and feature-rich platform for network virtualization. With the above basic commands, you can control the Open vSwitch service on your Ubuntu 20.04 and manage your virtual networking configuration effectively.

Remember that practice makes perfect. As you spend more time with OVS, you will become more comfortable navigating its many features and capabilities. Stay tuned for more in-depth articles detailing advanced Open vSwitch operations and potential use cases. Happy networking!

---

# **About Me 👨‍💻**

I'm Faiz A. Farooqui. Software Engineer from Bengaluru, India.  
Find out more about me @ [**faizahmed.in**](http://faizahmed.in)
