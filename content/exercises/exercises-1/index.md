---
title: "[CUDA] Vector Sum"
date: 2023-10-27T10:00:00+00:00
draft: false
---

# Laplace Relaxation Exercise

## What this program does
`laplace.c` solves the steady-state 2-D Laplace equation on a square grid using a simple relaxation (Jacobi) scheme. Boundary conditions are initialized in the marked section of the code and the algorithm iteratively updates the interior points until the maximum variation between iterations drops below the desired tolerance or a maximum number of iterations is reached.

## Files you must NOT edit
- `input/` contents (e.g., `input/input.100`)
- `output/` contents (e.g., `output/results.100`)
- `Makefile`
- `test_laplace.sh`

Only modify the code between the guard comments in the source files:
```
// ========================= INIT AREA OF INTEREST =========================
...
// ========================= END AREA OF INTEREST =========================
```

## Serial vs parallel code
- Use `laplace.c` as the provided serial baseline for correctness checks.
- Implement your OpenMP-parallel version in `laplace-omp.c`; keep `laplace.c` unchanged so it can be used for reference and testing.

## Build, clean, and test
- Build (default target): `make laplace-omp`
- Remove generated binaries: `make clean`
- Run the provided regression tests: `make test`

## Comparing outputs
Do not worry about occasional large-looking discrepancies reported by the harness; they typically stem from printing differences in the last decimal places. Always verify numerical agreement manually with:
```
diff output expected_output
```
The results are acceptable as long as numbers only differ in the trailing digits.