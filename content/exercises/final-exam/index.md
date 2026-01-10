---
title: "Final Exam"
date: 2026-01-06T16:06:05+01:00
draft: false
technology: "exam"
---

# High-Energy Particle Storm Simulation

## 1. Introduction
The purpose of this project is to perform a simplified simulation of high-energy particle storms bombarding a surface, such as the hull of a space vessel. The simulation analyzes the energy accumulated on a cross-section of the material, represented by a discrete array of control points.

The goal of this assignment is to parallelize a provided sequential reference code using two specific parallel programming models: **MPI + OpenMP** and **CUDA**.

## 2. Simulation Logic
The program processes a sequence of "waves" of particles. For each wave, the simulation proceeds in three distinct stages:

### A. Bombardment Phase
Particles impact specific points on the surface.
* **Energy Transfer:** The impacting particle transfers energy to the contact point and its neighborhood.
* **Attenuation:** Energy accumulation attenuates based on the distance from the impact point. The farther the point, the lower the energy.
* **Threshold:** A minimum energy threshold must be met; otherwise, no energy is accumulated at that specific point.

### B. Relaxation Phase
After bombardment, the material reacts by distributing the heat/charge.
* **Smoothing:** Each control point is updated to the average value of three points: the previous neighbor, the point itself, and the next neighbor.
* **Data Integrity:** To avoid race conditions (overwriting values needed for neighbor calculations), values are first copied to an ancillary array before the update occurs.

### C. Analysis Phase
* The program locates the point with the highest accumulated energy for the current wave.
* Results (position and value) are stored for final reporting.

## 3. Project Structure
You are provided with the following key files:

* **`energy_storms_seq.c`**: The reference sequential code. Use this to understand the logic.
* **`energy_storms_mpi_omp_core.c`**: The template for your MPI + OpenMP implementation.
* **`energy_storms_cuda_core.cu`**: The template for your CUDA implementation.
* **`Makefile`**: Build script for compiling the project.
* **`test_files/`**: Directory containing sample particle wave inputs.

## 4. Input and Output Formats

### Input: Wave Files
The simulation accepts a list of text files, where each file represents a "wave" of particles.
* **Line 1:** Integer indicating the number of particles in the file.
* **Subsequent Lines:** Two integers separated by a space:
    1.  Index of the impact point.
    2.  Energy value (in thousandths of a Joule).

> **Note:** Students are encouraged to generate their own test files for robust testing.

### Output
* **Standard Output:** The execution time (excluding I/O) and a list of positions and maximum energy values after each wave.
* **Debug Mode:** If compiled with `-DDEBUG` and the array size is $\le 35$, a graphical ASCII bar chart is printed.
    * `x`: Indicates a local maximum.
    * `M#`: Indicates the global maximum for wave number `#`.

## 5. Usage

### Compilation
To see available compilation options, run:
```bash
make help
```
Ensure you compile with optimization flags (e.g., `-O3`) for performance measurements.

### Execution
The program requires the following command-line arguments:
```bash
./<executable_name> <size> <wave_file_1> <wave_file_2> ...
```
- `size`: Number of control points (array size).
- `wave_file_n`: Sequence of filenames describing the waves

## 6. Implementation Requirements
__Files to Modify__

You are strictly limited to modifying only the following two files:
1) `energy_storms_mpi_omp_core.c`
2) `energy_storms_cuda_core.cu`

__Constraints__

- __Parallel Models__: You must strictly use the proposed models (MPI+OpenMP for the C file, CUDA for the CU file).
- __Immutable Sections__: Do not modify argument processing, memory allocation, time measurement, or result output sections.
- __Target Section__: Your modifications should focus on the computation section located between the start and end time measurements.
- __Helper Functions__: You may modify, substitute, or eliminate functions called within the target computation section.
- __Algorithm__: Do not fundamentally alter the algorithm or data structures without prior approval, as the goal is to parallelize the specific proposed logic.

## 7. Credits

Code adapted from the EduHPC 2018 Peachy Assignment materials by Arturo Gonzalez-Escribano and Eduardo Rodriguez-Gutiez, Group Trasgo, Universidad de Valladolid (Spain).