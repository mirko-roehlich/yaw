# Design

Each section is one decision: what it is, why, and when to change it.

## Claude Code only

YAW uses the parts of Claude Code directly: skills, subagents, hooks, settings, and
`SendMessage`. There is no layer for other coding agents.

**Why:** A neutral layer rebuilds what Claude Code already does: start an agent, wait
for it, continue it, show it to the user. The rebuilt parts were weaker, and each one
was one more thing to keep in step.
**When to change it:** A second coding agent becomes necessary. Then add its files
beside these, not a layer below them.

## The implementer gets its own worktree

The implementer has `isolation: worktree`. The WorktreeCreate hook creates its
worktree beside the main checkout. The other agents work from the main checkout with
absolute paths: `git -C <worktree>` for git, `cd <worktree> &&` for other commands.

**Why:** The shell of a subagent starts in its own folder for every command. A `cd`
does not stay between two commands. Claude Code asks before git runs after a `cd`,
also with an allow rule. With isolation, the implementer starts in its worktree.
The hook names the folder `issue-<n>` after the issue in the prompt of the agent. It
finds the prompt in the transcript of the session. If it finds no issue, it keeps the
name that Claude Code gives, for example `agent-<id>`.

**When to change it:** Claude Code keeps the working folder of a subagent between
commands. Or Claude Code passes the prompt of the agent to the hook, and the hook no
longer needs the transcript.

## The tester and the implementer are different agents

The tester writes the red suite from the behaviours of the issue. The implementer
makes it pass. A test that the implementer thinks is wrong is a dispute that the
tester settles.

**Why:** With one author, the test drifts to whatever the code does.
**When to change it:** Never in the workflow. In a session of your own, the rule
holds in spirit.

## The main checkout in a project folder

The main checkout is `<project>/main`. Each worktree is a sibling folder. The settings
give every session the project folder as a working directory
(`additionalDirectories: [".."]`).

**Why:** Adoption does not have to convert the repository. The agents reach the
worktrees and nothing else.
**When to change it:** A project already has another layout. Then change the hooks
and the `worktree` skill.

## A broad allow list behind a deny fence

The settings allow git, `gh`, and the commands of the gates. A deny list fences off
what must not happen: a push to `main`, `--no-verify`, a merge, an approval, a forced
worktree removal.

**Why:** A permission prompt stops an agent in the middle of its work. The fence
protects what matters, and the user merges.
**When to change it:** An agent does something that the fence should stop. Then add a
deny rule.

## MIT license

YAW is MIT. Adoption copies `LICENSE` into the project. The vendored `simple-english`
skill keeps its own license beside it.

**Why:** Anyone can use and change YAW. The only condition is to keep the notice.
**When to change it:** YAW ships code where a patent grant matters.
