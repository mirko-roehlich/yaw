---
name: pr-workflow
description: Commits, pull requests, CI, and the worktree layout.
---

# Pull request workflow

## Commits

- **Atomic commits:** small, focused, one purpose.
- Do not mix logic with formatting, or logic with a refactor. A refactor and a change
  of behaviour never share a commit.
- Test of a good message: the intent fits in one short line.

## Commit messages

An optional scope, a lowercase imperative summary, no period at the end:

```text
[scope: ]<imperative summary>

<why the change is necessary, and which behaviour or bug it addresses>

Fixes #1234
```

The scope is the name of a module or an area. `tests` is the scope of a commit that
touches test files only. That commit belongs to the tester and never carries
production code. Explain the intent. Do not narrate the diff.

## Pull requests

- Keep a pull request focused and small. Keep the diff minimal.
- Change only what the issue needs. Do not reformat, rename, or improve the code next to
  your change. Use the style that is there. A refactor that the change needs goes in
  its own commit, before the change.
- Remove what your change made unused. Leave older dead code, and name it under
  "Follow-ups".
- Each commit tells part of the story.
- Run the gates locally before the push: the `gates` skill.
- Fill in the pull request template. The `open-pr` skill says how.
- No test plan in the body. The tests are in the diff, and CI proves that they run.
  If the template asks for one, refer to the tests and to CI.
- The user merges. No agent merges, approves, or requests changes.

## CI

Every gate is a required check. A red check means: fix it. Merging past one is an
incident, not a shortcut.

## Worktrees

One project folder holds the main checkout and one worktree per issue:

```text
<project>/main      the main checkout: coordinate, review, create worktrees; never commit here
<project>/<name>    one worktree per issue, with its branch issue/<n>-<slug>
```

The WorktreeCreate hook creates a worktree for an agent with `isolation: worktree`, for
`claude --worktree <name>`, and for the `worktree` skill. A worktree lives until its
pull request is merged. No tool removes uncommitted work.

An agent whose shell starts in another folder reaches a worktree with absolute paths:
`git -C <worktree> <command>` for git, and `cd <worktree> && <command>` for every
other command. A `cd` does not stay between two commands. Claude Code asks before git
runs after a `cd`, so git always gets `-C`.

## Secrets

Never commit `.env` files, credentials, or secrets.
