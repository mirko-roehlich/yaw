---
name: handoff
description: Close a working session in a worktree. Write the Handoff section of .work/plan.md with pointers to the commits, the pull request, the issue comments, and the open rulings, plus the one next step. The implement-issue skill uses it as its last step. Use it directly before you leave a worktree in the middle of an issue.
---

# Handoff

Append to `## Handoff` in `.work/plan.md`, pointers only:

- `<date> · <branch> @ <short sha>`: from `git branch --show-current` and
  `git rev-parse --short HEAD`.
- `PR: <url>` or `PR: none`.
- `Issue comments: <urls>`: the comments of this session, if any.
- `Open rulings: <k>`: the count of Rulings lines whose cost no test and no review has
  settled. Name them by their first words.
- `Next: <one sentence>`: the first thing that the next session does.
- `Blocked: <question>`: only when the session stops on something that the user must
  answer. The pull request is a draft then, and the Stop hook lets the session end.

Never paste a diff, code, or a copy of the behaviours. The plan has them already. An
earlier Handoff stays. Append new entries at the end.
