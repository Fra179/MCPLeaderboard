---
title: "MPI 1D Heat Equation"
date: 2026-11-02T12:00:00+01:00
draft: false
technology: "MPI"
graded: true
deadline: "2026-11-13T23:59:00+01:00"
github_url: "frdb.me/mpi-1d-heat-equation"
leaderboard_metric: "Median Runtime"
leaderboard_order: "asc"
---

# PlumJuice Heat Equation Challenge

{{< faqlink >}}

**Graded submission deadline: 13 November 2026 (13/11/2026).**

{{< githublink >}}

This exercise models how heat spreads along a one-dimensional object, such as a
thin rod. Imagine that different points along the rod start at different
temperatures: over time, heat flows from hotter regions toward colder ones.
The heat equation describes this evolution. In the program, the rod is
represented by a sequence of points, and each time step updates a point's
temperature using its current temperature and those of its immediate neighbors.
The goal is to compute the temperature distribution after the prescribed number
of time steps. Using MPI, you will share this work across processes, exchanging
the neighboring temperatures needed at the boundaries between their portions
of the rod.

This challenge has been kindly prepared by the amazing people at [PlumJuice](https://plum-juice-project.github.io/plum-io/) for one of their hackathons. Your goal is to implement the required logic inside `student.c` without touching the protected parts of the project.

## File Constraints
- Do **not** modify any file under `tests/**/input` or `tests/**/output`.
- Do **not** edit `Makefile`, `src/main.c`, or `src/utils_1d.h`.
- You may change `student.c` and `student.mk`.

Any deviation from these rules will invalidate your submission, so please double-check before committing changes.

## MPI Notes
`src/main.c` initializes and finalizes MPI and calls `heat_eqn_solver_1d` from `student.c` on every rank. Each rank initially receives the full temperature array. Implement your parallel solver while preserving the explicit finite difference scheme; return the final array and cumulative error on rank 0. Return 0 on success, -1 on failure.

You may add any includes and helper functions to `student.c`. Keep the public function signature declared in `src/utils_1d.h`. The starting implementation runs the sequential algorithm independently on every rank.

## Build, Clean, and Test
From the repository root you can use the provided make targets:

```sh
make        # build ex01.app
make test   # run the bundled regression tests
```
To clean the working directory of any build file, you can run

```sh
make clean  # remove the executable and object files
```

The grader builds your `student.c` implementation using your `student.mk` settings; protected files must stay untouched.

## Custom build settings

Edit `student.mk` to customize the build without changing the protected `Makefile`. For example:

```make
CFLAGS += -O3
CPPFLAGS += -DMY_OPTION=1
# LDLIBS += -lmy_library
```

Available settings are `CC`, `CPPFLAGS`, `CFLAGS`, `LDFLAGS`, and `LDLIBS`. Use `+=` to extend the defaults or `=` to replace them. Command-line settings take precedence, for example `make CFLAGS="-O2 -Wall"`. Changes to `student.mk` automatically rebuild the programs; after changing only command-line settings, run `make clean` before rebuilding. The grader uses the submitted `student.mk` too.

The Makefile always supplies `-DUSE_MPI -Isrc`, including when `CPPFLAGS` is replaced. The default optimization level is `-O2`.

## Local smoke tests

`make test` checks output correctness using Python 3. Run `make test FULL=1`
to check all supplied fixtures. MPI tests default to four ranks; override the
launcher with, for example, `MPIEXEC="mpirun -np 2" make test`.
Set `TEST_TIMEOUT` to change the per-run timeout (default: 300 seconds).
These checks do not verify parallelism or prevent hardcoded answers.
