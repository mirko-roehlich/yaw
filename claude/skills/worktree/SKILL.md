---
name: worktree
description: Create or remove a worktree beside the main checkout. One worktree per issue, never work in the main checkout. Use "worktree <name>" to create one, "worktree remove <name>" after the pull request is merged.
argument-hint: "<name> | remove <name>"
---

# Worktree: $ARGUMENTS

The layout is in `.claude/rules/pr-workflow.md`, "Worktrees": `<project>/main` is the
main checkout, and every other `<project>/<name>` is a worktree. `<project>` is the
folder above the main checkout.

## Create: `<name>`

1. Refuse if `<name>` is not a kebab-case slug, or if a worktree with that name exists
   already (`git worktree list`). Report its path instead.
2. Run the hook from the main checkout:
   `echo '{"name":"<name>","cwd":"<main>"}' | node .claude/hooks/worktree-create.mjs`.
   It creates `<project>/<name>` on a new branch from `origin/main`, runs the setup
   command of `.claude/yaw.json`, and writes `.work/plan.md`.
3. Report the path and the next step: a session in that folder
   (`cd <path> && claude`, then `/implement-issue <n>`). A running session cannot move
   to another folder. Do not continue the issue from the main checkout.

## Remove: `remove <name>`

1. Refuse unless the pull request of the branch is merged
   (`gh pr list --state merged --head <branch>`) and the worktree is clean
   (`git -C <path> status --porcelain` is empty). This skill never deletes uncommitted
   work. Report it.
2. `git worktree remove <path>`, `git branch -D <branch>` (a squash or rebase merge
   leaves the branch unmerged for git), and `git fetch --prune`.
3. Report what you removed.

## Never

- Commit on `main`. The main checkout exists to create worktrees, coordinate, and
  review.
- Remove a worktree with `--force`.
