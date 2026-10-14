---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
technology: "Sequential"
leaderboard_metric: "Median Runtime"
leaderboard_order: "asc"
---

# TODO: Problem Name

{{ "{{< faqlink >}}" }}

## 1. Introduction
TODO: One or two paragraphs on what the program simulates or computes.

The goal of this assignment is to parallelize the provided sequential reference code using **TODO: programming model(s)**.

## 2. Algorithm
TODO: Describe the computation step by step, so students understand what must be parallelized.


## 3. Project Structure
You are provided with the following key files:

* **`TODO_seq.c`**: The reference sequential code. Use this to understand the logic.
* **`TODO_core.c`**: The template for your implementation.
* **`Makefile`**: Build script for compiling the project.
* **`test_files/`**: Directory containing sample inputs.

## 4. Input and Output Formats

### Input
TODO: Describe the input format (command-line arguments, file layout, ...).

> **Note:** Students are encouraged to generate their own test files for robust testing.

### Output
* **Standard Output:** The execution time (excluding I/O) and TODO: the results printed.

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
./<executable_name> TODO: arguments
```
- `TODO`: Argument description.

## 6. Implementation Requirements
__Files to Modify__

You are strictly limited to modifying only the following files:
1) `TODO_core.c`


## 7. Credits

TODO: Source of the original code, or remove this section.
