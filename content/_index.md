---
title: "Embedded and Multicore Systems Programming"
description: "Course syllabus, logistics, and technical overview for the 2025/2026 academic year."
date: 2025-09-23
author: "Daniele De Sensi"
draft: false
---

## Course Overview

**Programmazione di Sistemi Embedded e Multicore** focuses on the technical foundations of parallel programming, a necessity driven by the physical limits of modern hardware scaling. As single-thread performance gains have plateaued, performance improvements now rely on multicore and distributed architectures rather than frequency scaling.

This course covers the design and implementation of explicitly parallel programs using low-level C APIs, targeting shared-memory, distributed-memory, and heterogeneous (GPU) systems.

---

## Logistics

### General Information
* **Teacher:** Daniele De Sensi (`desensi@di.uniromal.it`).
* **Academic Year:** 2025/2026.
* **Language:** C is the reference programming language.
* **Resources:** Slides, code, and exercises are available on the [Moodle Course Page](https://elearning.uniromal.it/course/view.php?id=19949).

### Schedule
* **Tuesday:** 17:00 – 19:00 (Aula Magna RM111).
* **Wednesday:** 14:00 – 17:00 (Aula 11, Via Scarpa).
* **Office Hours:** Available by appointment via email.
* **Hands-on Labs:** Practical coding sessions will occur during specific 3-hour slots (laptop required).

### Textbooks
* *An Introduction to Parallel Programming*, 2nd ed., Pacheco & Malensek.
* Additional resources for GPU programming and extra materials are linked on Moodle.

---

## Syllabus & Technical Modules

The course is structured into six technical chapters covering the hardware-software interface and specific parallel paradigms.

### 1. Fundamentals of Parallel Computing
* **Why Parallel Computing:** Analysis of the "AI Boom," data availability, and the stalling of Moore's Law scaling.
* **Hardware Constraints:** Power consumption walls, heat dissipation, and the shift from monolithic processors to multicore designs.

### 2. Parallel Hardware & Software Architecture
* **Architectures:**
    * **Shared-Memory:** Cores share access to global memory; coordination via locking and shared variables.
    * **Distributed-Memory:** Cores possess private memory; communication requires explicit message passing.
    * **Flynn's Taxonomy:** MIMD (Multiple-Instruction Multiple-Data) vs. SIMD (Single-Instruction Multiple-Data).
* **Latency Analysis:** Understanding the cost of operations (e.g., L1 cache vs. Main Memory vs. Network RTT).

### 3. Distributed Programming
* **Technology:** MPI (Message-Passing Interface).
* **Focus:** Managing private memory spaces and coordinating independent cores across a network.

### 4. Shared-Memory Programming
* **Technology:** OpenMP.
* **Focus:** Compiler directive-based parallelization for shared-memory systems.

### 5. GPU Programming
* **Technology:** CUDA.
* **Focus:** SIMD architecture, handling massive parallelism (e.g., thousands of threads), and memory hierarchy management on NVIDIA hardware.

---

## Evaluation Method

The final grade is calculated as the average of two components:
1.  **Project:** Practical implementation of parallel systems.
2.  **Oral Exam:** Theoretical assessment.

## Excercises

From this website it will be possible to see the leaderboard for each published exercixe: Please have a look either at the sidebar on the left or at the [Excercises Page](/exercises)

*Note: Possibility of extra points for intermediate evaluations (TBD).*