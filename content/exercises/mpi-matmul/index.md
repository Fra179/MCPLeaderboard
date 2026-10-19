---
title: "MPI Matmul"
date: 2026-10-14T22:51:51+02:00
draft: false
technology: "MPI"
leaderboard_metric: "Median Runtime"
leaderboard_order: "asc"
github_url: "frdb.me/mpi-matmul"
---

# Matrix Multiplication

{{< faqlink >}}

## 1. Introduction
{{< githublink >}}

This program computes the product of two square matrices, `C = A × B`.
`A` and `B` are filled with constant values, so every element of the result is known in advance and the output can be checked quickly.

The goal of this assignment is to parallelize the provided sequential reference code using **MPI**, so that the multiplication runs correctly on multiple processes.

## 2. Algorithm
All three matrices have size `order × order` and are stored as flat, row-major arrays of `double`.

### A. Initialization
* Every rank allocates `B`.
* Only **rank 0** allocates `A` and `C`, and only rank 0 initializes the matrices: every element of `A` is set to `3.0`, every element of `B` to `5.0`, and `C` to `0.0`.
* On all other ranks, `A` and `C` are not allocated and `B` contains uninitialized values.

### B. Multiplication
The classic triple loop: for each row `i` of `A` and each column `j` of `B`, `C[i][j]` accumulates the dot product of row `i` and column `j`:

```c
for (i = 0; i < Ndim; i++)
    for (j = 0; j < Mdim; j++)
        for (k = 0; k < Pdim; k++)
            C[i][j] += A[i][k] * B[k][j];
```

### C. Verification
* Each rank measures its own running time, and the maximum is reduced to rank 0.
* Rank 0 compares every element of `C` with the expected value `order × 3.0 × 5.0`. If the squared error is within tolerance, it prints `Hey, it worked!`.

## 3. Project Structure
You are provided with the following key files:

* **`matmul.c`**: The reference sequential code. Use this to understand the logic.
* **`matmul_mpi.c`**: The template for your MPI implementation.
* **`Makefile`**: Build script for compiling the project.
* **`test_matmul.sh`**: Test script that runs the MPI version on several matrix sizes and checks the result.

## 4. Input and Output Formats

### Input
There are no input files: the only input is the matrix order, passed on the command line.

### Output
* **Standard Output:** The execution time of the multiplication, the achieved MFLOPs, and the outcome of the check (`Hey, it worked!` or `Errors in multiplication: <error>`).

## 5. Usage

### Compilation
Use the provided `Makefile`:
```bash
make matmul      # sequential reference
make matmul_mpi  # your MPI implementation
make all         # both
```

### Execution
The program requires the following command-line argument:
```bash
mpirun -np <processes> ./matmul_mpi.out <matrix_order>
```
- `processes`: Number of MPI processes.
- `matrix_order`: Size of the (square) matrices.

### Testing
Run the full test suite with:
```bash
make test
```
This runs `matmul_mpi.out` with **4 processes** on matrices of order **1000**, **1500** and **2000**, and checks that each run prints `Hey, it worked!`.

## 6. Implementation Requirements
__Files to Modify__

You are strictly limited to modifying only the following file:
1) `matmul_mpi.c`

__Constraints__

- __Parallel Model__: You must use MPI.
- __Target Section__: Only modify the code between the `AREA OF INTEREST` and `END AREA OF INTEREST` comments. MPI is already initialized for you.
- __Immutable Sections__: Do not modify argument processing, memory allocation, initialization, time measurement, or the result check.
- __Result__: At the end of the area of interest, the complete result must be stored in `C` on rank 0, where it is verified.

## 7. Credits

Code adapted from the matrix multiply example by Tim Mattson (Nov 1999).
