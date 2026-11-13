---
title: "How to update main.c"
date: 2026-11-13T10:49:00+01:00
draft: false
url: "/exercises/mpi-1d-heat-equation/how-to-update/"
---
> [!WARNING]
> You're at risk of losing unstaged changes
> make sure all files are committed properly

How to update your main.c file to the new version

## 1. Start with a clean working directory
```bash
git status
```

Make sure to commit or stash any uncommitted work before continuing.

## 2. Add the template remote

```bash
git remote add template https://github.com/mcp-25/mpi-1d-heat-equation-26

git remote -v
```

you should then see the new `template` remote

## 3. Fetch the template updates
```bash
git fetch template
```

## 4. Perform the merge
```bash
git merge template/master --allow-unrelated-histories --no-commit --no-ff

# Keep your local version for all the files in the repository
git restore --source=HEAD --staged --worktree -- .

# Make sure src/main.c follows the template/master version
git restore --source=template/master --staged --worktree -- src/main.c
```

## 5. Review, commit and push

```bash
# Make sure no unintended change was made to your local files
git diff --cached
git status

# Push push push
git commit -m "Merge template updates for src/main.c only"
```

## 6. Changelog:
1) Added a missing `MPI_Barrier()` before starting the timer. This ensure a more consistent time measuraments across MPI processes.
2) Added communication channel warmup before the timer starts. 