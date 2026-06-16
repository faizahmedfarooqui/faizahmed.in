---
title: "Creating a MicroVM with QEMU"
datePublished: Fri Oct 13 2023 18:30:00 GMT+0000 (Coordinated Universal Time)
cuid: clnwsue7i000f0ala31yx7c8o
slug: creating-a-microvm-with-qemu
cover: ./cover.jpg
tags: qemu, cloud, virtual-machine, cloud-computing, linux
series: vcw

---

Virtualization is a powerful technology that allows you to run multiple operating systems on a single host system. QEMU, an open-source emulator, is an excellent tool for creating virtual machines on macOS. In this guide, we will walk you through the process of preparing an Alpine Linux image and booting it up using QEMU on your macOS system. Alpine Linux is known for its lightweight nature and security, making it an ideal choice for virtualization

## **Prerequisites:**

* Prior to beginning, please verify that you have already installed QEMU on your system. You can refer to the following tutorial for guidance: [Getting Started with QEMU: Your Gateway to Virtual Machines](https://blog.faizahmed.in/preview/651fdcdab43180000f1f2581).
    
* Additionally, ensure you have downloaded an Alpine Linux ISO file to your system.  
    You can download it from [here](https://alpinelinux.org/downloads/).
    
* You will also need to download the QEMU\_EFI image, which can be obtained from [this link](http://snapshots.linaro.org/components/kernel/leg-virt-tianocore-edk2-upstream/latest/QEMU-AARCH64/RELEASE_GCC5/QEMU_EFI.img.gz).
    

## **Steps to Prepare the Alpine Linux Image and Boot the VM:**

1. **Create Disk Images:**
    
    Before you can boot the Alpine Linux VM, you need to create a disk image to install the operating system. Use the following command to create a 5GB disk image file named `alpine.qcow2`:
    
    ```bash
    $ qemu-img create -f qcow2 alpine.img 5G
    ```
    
    Additionally, you'll want to create a variable storage disk image named `varstore.img`. This 64MB virtual disk acts as dedicated storage for temporary data and configurations used by your Alpine Linux virtual machine. In order to create `vartstore.img` you need to follow this command:
    
    ```bash
    $ qemu-img create -f qcow2 varstore.img 64M
    ```
    
2. **Start the Alpine Linux Installation:**  
    Use the following command to start the Alpine Linux installation:
    
    ```bash
    $ qemu-system-aarch64 -m 1024 \
      -drive if=pflash,format=raw,file=QEMU_EFI.img \
      -drive if=pflash,file=varstore.img \
      -drive if=virtio,file=alpine.img \
      -cdrom alpine-linux.iso -boot d -netdev user,id=eth0 \
      -device virtio-net-pci,netdev=eth0
    ```
    
    * `-m 1024` specifies the VM's memory size (1GB).
        
    * `-drive if=pflash,format=raw,file=QEMU_EFI.img` line refers to the pflash disk image for EFI firmware.
        
    * `-drive if=pflash,file=varstore.img` line designates the variable storage disk image.
        
    * `-drive if=virtio,file=alpine.img` is for the main Alpine Linux disk image.
        
    * `-cdrom alpine-linux.iso` mounts the Alpine Linux ISO as a CD-ROM.
        
    * `-boot d` specifies to boot from the CD-ROM.
        
    * `-netdev user,id=eth0 -device virtio-net-pci,netdev=eth0` configures a user-mode network connection.
        
3. **Install Alpine Linux:**  
    Once the installation is successful, and you are in the VM for first time then please run the below command to setup your VM to use Alpine-Linux.
    
    ```bash
    setup-alpine
    ```
    
    Follow the on-screen instructions to install Alpine Linux on the virtual machine. You can choose to install it on the virtual disk you created (`/dev/vda`).
    
4. **Boot the VM:**
    
    Once the installation is complete, shut down the VM using `^ + d`, or enter `poweroff` and then boot the VM with your newly installed Alpine Linux using the following command —
    
    ```bash
    qemu-system-aarch64 -m 4G -nographic \
    -drive if=pflash,format=raw,file=QEMU_EFI.img \
    -drive if=pflash,file=varstore.img \
    -drive if=virtio,file=alpine.img \
    -netdev user,id=eth0,hostfwd=tcp::2222-:22 \
    -device virtio-net-pci,netdev=eth0
    ```
    
    Your Alpine Linux VM is now up and running.
    

## **Conclusion:**

You've successfully prepared an Alpine Linux image and booted it up on your macOS system using QEMU. This lightweight and secure Linux distribution is ideal for various virtualization tasks. Explore Alpine Linux's package management system, build custom VMs, and enjoy the flexibility and performance that QEMU offers for virtualization on macOS.

---
