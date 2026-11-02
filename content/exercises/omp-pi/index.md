---
title: "OpenMP Monte Carlo Pi"
date: 2026-11-02T12:00:00+01:00
draft: false
technology: "OMP"
graded: false
github_url: "frdb.me/omp-pi"
leaderboard_metric: "Median Runtime"
leaderboard_order: "asc"
---

# OpenMP Monte Carlo Pi exercise

{{< faqlink >}}
{{< linebreak >}}
{{< githublink >}}

Use `pi.c` as the serial reference and parallelize the implementation in `student.c` using OpenMP.

## Student interface

Implement `student_pi(long num_trials)` as declared in `student.h`.

Estimate pi by sampling random points in the unit square. The driver seeds the random generator. Consider the safety and cost of random-number generation when parallelizing.

Edit `student.c` and `student.mk`. You may add any includes, helper functions, and file-local declarations there. Keep the public function signature unchanged. `pi_omp.c` calls your function and handles the program's input, output, and timing; the Makefile compiles and links `student.c` as a separate translation unit.

Keep the serial reference, `student.h`, the parallel driver, Makefile, test scripts, and supplied input/expected-output files unchanged.

## Build and test

- `make all`: build the serial and parallel programs.
- `make pi_omp`: build the parallel program.
- `make test`: run the exercise checks.
- `make clean`: remove compiled programs.

This exercise is adapted from the [SC08 OpenMP tutorial by Mattson and Meadows](https://www.openmp.org/wp-content/uploads/omp-hands-on-SC08.pdf).

Run `./pi_omp 1000000` to use one million samples, or omit the argument for the default 100 million samples. The program prints the estimate and kernel runtime.


## Custom build settings

Edit `student.mk` to customize the build without changing the protected `Makefile`. For example:

```make
CFLAGS += -O3
CPPFLAGS += -DMY_OPTION=1
# LDLIBS += -lmy_library
```

Available settings are `CC`, `CPPFLAGS`, `CFLAGS`, `LDFLAGS`, and `LDLIBS`. Use `+=` to extend the defaults or `=` to replace them. Command-line settings take precedence, for example `make CFLAGS="-O2 -Wall"`. Changes to `student.mk` automatically rebuild the programs; after changing only command-line settings, run `make clean` before rebuilding. The grader uses the submitted `student.mk` too.

The Makefile always supplies the required OpenMP flag (`-fopenmp`).

## Local smoke tests

`make test` checks output correctness using Python 3. Run `make test FULL=1`
to check all supplied fixtures. MPI tests default to four ranks; override the
launcher with, for example, `MPIEXEC="mpirun -np 2" make test`.
Set `TEST_TIMEOUT` to change the per-run timeout (default: 300 seconds).
These checks do not verify parallelism or prevent hardcoded answers.
