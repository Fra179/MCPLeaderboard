---
title: "OpenMP N-body"
date: 2026-11-02T12:00:00+01:00
draft: false
technology: "OMP"
graded: true
deadline: "2026-11-27T23:59:00+01:00"
github_url: "frdb.me/omp-nbody"
leaderboard_metric: "Median Runtime"
leaderboard_order: "asc"
---

# OpenMP N-body interactions exercise

{{< faqlink >}}

**Graded submission deadline: 27 November 2026 (27/11/2026).**

{{< githublink >}}

This exercise tackles the interaction calculation at the heart of the N-body
problem: given the positions of N bodies in space, determine the total force
acting on each body and the potential energy of the system. Think of a collection
of particles attracting one another: each body's force is the sum of its
interactions with the other bodies within a chosen distance cutoff. Here, the
positions stay fixed; you compute the interactions for one configuration rather
than simulate the bodies' motion over time. As the number of bodies grows, the
number of pairs to examine grows rapidly, making this calculation a useful
candidate for parallel execution.

Parallelize the pairwise interaction calculation in `student.c` using OpenMP.
The starting implementation is sequential; `nbody.c` provides the serial
reference. Your implementation must compute the same forces and potential
energy while distributing the work across threads.

## What to compute

The input contains the three-dimensional positions of either 20,000 or 55,000
bodies. For each distinct pair of bodies `i < j`, compute:

```text
rij = pos[i] - pos[j]
d2  = rij[0]^2 + rij[1]^2 + rij[2]^2
```

Include the interaction when `d2 <= cut2`. For an included pair, let
`d = sqrt(d2)` and update each coordinate `k` as follows:

```text
f = -rij[k] / (d * d2)
forces[i][k] += f
forces[j][k] -= f
```

Add `-1 / d` to the total potential energy once per included pair. The driver
uses `cut2 = 1000.0`, the squared interaction cutoff. Preserve this calculation
and count every distinct pair exactly once. This exercise computes interactions
for fixed positions; it does not advance the bodies through time.

## Student interface

Implement the function declared in `student.h`:

```c
double student_nbody(unsigned nbodies, double (*pos)[3], double cut2,
                     double (*forces)[3]);
```

- `nbodies` is the number of bodies.
- `pos` contains their coordinates. Treat these positions as read-only.
- `cut2` is the squared distance cutoff.
- `forces` is an initially zero array with three components per body. Fill it
  with the accumulated forces.
- Return the total potential energy.

The driver in `nbody_omp.c` reads the positions, allocates the arrays, calls your
function, reports elapsed time, and writes the `results` file. The first output
line contains potential energy; each following line contains a body index and
its three force components.

## Parallelization considerations

Different pairs can update the same body's force vector. Simply adding a
parallel loop to the sequential implementation can therefore introduce data
races. Ensure that force accumulation and the energy sum are correct when
multiple threads execute concurrently. Consider how your approach affects
synchronization, load balance, and memory use as the thread count grows.

Floating-point addition order can change under parallel execution; the tests
compare numerical results with a tolerance. Check correctness with several
thread counts before comparing performance against the serial reference.

## Editable files

Edit only `student.c` and `student.mk`. You may add includes, helper functions,
and file-local declarations in `student.c`, but keep the public function
signature unchanged. The Makefile compiles it as a separate translation unit.

Keep the serial reference, `student.h`, the parallel driver, Makefile, test
scripts, and supplied input/expected-output files unchanged.

## Build, run, and test

Run these commands from this exercise's directory. You need a C compiler with
OpenMP support, Make, and Python 3 for the tests.

```sh
make all                              # build serial and parallel programs
OMP_NUM_THREADS=4 ./nbody_omp.out 20000 # read positions.xyz.20000; write results
./nbody.out 20000                      # serial reference; also writes results
make test                             # check the 20,000-body fixture
make test FULL=1                       # check both supplied fixtures
OMP_NUM_THREADS=2 make test            # check with a different thread count
make clean                            # remove compiled programs
```

The other supported problem size is `55000`, using `positions.xyz.55000`.
Keep the corresponding positions file in the working directory when running
an executable directly. Each direct run overwrites `results`; the smoke tests
use temporary output directories. Set `TEST_TIMEOUT` to change the per-run
test timeout from its default of 300 seconds.

## Custom build settings

Edit `student.mk` to customize compilation without changing the protected
`Makefile`. For example:

```make
CFLAGS += -O3
CPPFLAGS += -DMY_OPTION=1
# LDLIBS += -lmy_library
```

Available settings are `CC`, `CPPFLAGS`, `CFLAGS`, `LDFLAGS`, and `LDLIBS`.
Use `+=` to extend defaults or `=` to replace them. Command-line assignments
take precedence, for example `make CFLAGS="-O2 -Wall"`. Changes to `student.mk`
automatically rebuild the programs; after changing only command-line settings,
run `make clean` before rebuilding. Use the same optimization settings when
comparing serial and parallel runtimes. The grader uses your submitted
`student.mk` settings too. The Makefile supplies `-fopenmp` for OpenMP support.
