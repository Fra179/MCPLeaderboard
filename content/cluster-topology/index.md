---
title: "Cluster Topology"
description: "Hardware topology diagrams of the cluster nodes, generated with lstopo."
date: 2026-10-21
draft: false
---

The diagrams below, generated with `lstopo`, show how CPU sockets, cores, caches, and NUMA memory are arranged within the cluster nodes. Use them when building your program as you can achieve better performance.

Click any diagram to view it at full size. In the labels, **PU** means processing unit (a logical CPU), **L#** is the logical index, and **P#** is the physical index reported by the operating system.

## Compute node

This view shows two CPU sockets and eight NUMA nodes, with 503 GB of total memory reported by `lstopo`.

[![Compute node topology showing CPU sockets, caches, cores, and eight NUMA nodes](topology.svg)](topology.svg)

## Booster node

The simplified view focuses on the CPU and memory hierarchy, with I/O devices hidden.

[![Booster node CPU and memory topology with I/O devices hidden](booster-topo-no-io.svg)](booster-topo-no-io.svg)

The full view also includes I/O devices and network interfaces.

[![Full Booster node topology including I/O devices and network interfaces](booster_topo.svg)](booster_topo.svg)
