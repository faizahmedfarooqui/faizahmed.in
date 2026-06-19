---
title: "Open vSwitch Setup: A Step-by-Step Guide"
datePublished: Fri Sep 22 2023 18:30:00 GMT+0000 (Coordinated Universal Time)
cuid: clmym714s000009k3heoq6275
slug: open-vswitch-setup
cover: ./cover.jpg
tags: openvswitch, linux, networking
series: vcw

---

In this article, we aim to provide a comprehensive guide on how to install Open vSwitch on Ubuntu. Open vSwitch, or OVS, is an open-source virtual switch designed to enable network automation while supporting standard management interfaces and protocols. For this tutorial, we will be using the Ubuntu 20.04 OS release.

Before starting, ensure that you have root access or sudo privileges to follow through with these instructions.

## Installation Steps:

### Step 1: Download OVS Binaries

Start the process by downloading the Open vSwitch binaries. [Click Here](https://www.openvswitch.org/releases/openvswitch-3.2.0.tar.gz) to download the required files.

### Step 2: Extract Files

Use the following command to extract the downloaded tar file:

```bash
tar -xvf openvswitch-3.2.0.tar.gz
```

Ensure that you replace "openvswitch-3.2.0.tar.gz" with the name of your actual downloaded file.

### Step 3: Build Open vSwitch

In the next step, navigate to the extracted binary directory and run the [`boot.sh`](http://boot.sh) script:

```bash
cd openvswitch-3.2.0
./boot.sh
```

### Step 4: Run the configuration script

Now we run the `configure` script which should create the `Makefile`.

```bash
./configure
```

Execute the above command in your terminal. This will check for any dependencies that you might need to address.

### Step 5: Make and Install

Once the configuration process runs without any errors, use the `make` and `make install` commands. These commands will compile and install OVS on your system.

```bash
make && make install
```

Please note, that compiling might take a bit of time - so be patient.

### Step 6: Add Open vSwitch scripts to $PATH

The PATH environment variable is a colon-delimited list of directories that your shell searches through when you enter a command. To execute OVS binaries from anywhere in the system, you should add the path of the OVS scripts to your PATH variable.

First, check if the path to the Open vSwitch script directory is already included in your PATH:

```bash
grep -qxF ‘export PATH=$PATH:/usr/local/share/openvswitch/scripts;’ ~/.bashrc
```

If this command does not output anything, you can add the path to your `.bashrc` file with this command

```bash
echo ‘\nexport PATH=$$PATH:/usr/local/share/openvswitch/scripts;’ >> ~/.bashrc;
```

### Step 7: Update the PATH variable

To load the updated PATH, run the following command in the terminal.

```bash
export PATH=$$PATH:/usr/local/share/openvswitch/scripts;
```

With this, your installation process should be complete.

Please note:

* It is advisable to reboot the system at this point to ensure all the changes have taken effect.
    
* While running any command, if you receive a "Permission Denied" error, try using "sudo" at the start of the command.
    

After you reboot, you should have a working Open vSwitch installation and will be ready to move forward and learn about how to configure and use it. Open vSwitch has a multitude of uses. With it, you can manage networking more efficiently and automate network tasks while utilizing standard management interfaces and protocols.

## Verifying the Installation

To ensure that Open vSwitch has been installed correctly, you can use the `ovs-vsctl` command to check its version. Type the following command in your terminal:

```bash
ovs-vsctl --version
```

The command will display the version of Open vSwitch installed on your system if the installation process was successful.

For example:

```bash
ovs-vsctl (Open vSwitch) 3.2.0
Compiled Jun 20 2021 09:50:19
```

This tells you that v3.2.0 was installed successfully.

## Conclusion

This guide walked you through the process of installing Open vSwitch on Ubuntu 20.04. By following the steps outlined above, you are now ready to deploy and test your virtual networking projects.

Open vSwitch is a powerful tool, and mastering its capabilities can be of great use to anyone seeking a career in networking or system administration. I hope this article helped guide you through the installation process.

Stay tuned for more educational articles on how to use Open vSwitch and other open-source projects.

---
