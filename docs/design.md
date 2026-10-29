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

## The main session builds one issue per run

The `build` skill runs in the main session. It takes one issue from its number to a
pull request with the label `ready-for-human`. Without a number, it picks the next
issue.

**Why:** The user sees every agent while it works and answers a question in the chat.
Nothing waits in the background, and nothing polls.
**When to change it:** One issue at a time is too slow. Then open one session per
issue. Each session is independent.

## The state lives on GitHub and in the worktree

The labels of the issue and one `**build:**` comment per stop hold the state of a
build. `.work/plan.md` in the worktree holds the session state: behaviours, contract,
rulings, and handoff.

**Why:** The state survives the end of a session, and the user can read it. A later
run continues from the labels and the comments. No script keeps a log.
**When to change it:** A project uses another forge. Then the skills need its
commands.

## Agents are continued, not restarted

The `build` skill starts the tester and the implementer once per run and continues
them with `SendMessage`, for disputes, challenges, and fix rounds.

**Why:** An agent keeps its context. A dispute or a fix round does not start from
zero.
**Costs:** An agent ends with the run that started it. A later run takes over the
branch with fresh agents. `.work/plan.md` carries the state across.

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

## Hooks enforce the rules that matter most

Two hooks in `.claude/settings.json` guard the work of the agents. The input of a hook
names the agent that acts (`agent_type`), and the script decides by it:

- A PreToolUse hook keeps the implementer away from the test files and the tester
  inside them. The user's own session is not checked.
- A SubagentStop hook refuses "done" for the implementer while a behaviour is open, a
  change is not committed, or the branch has no pull request. After three refusals,
  the agent can end anyway.

**Why:** A rule that an agent can skip is a suggestion. The test files decide whether
the work is correct, so their author must not be the implementer. The hooks are in the
settings, because hooks in the front matter of an agent did not run in a test with
`claude -p`.
**When to change it:** A hook blocks correct work again and again. Then fix the hook,
not the agent.

## The tester and the implementer are different agents

The tester writes the red suite from the behaviours of the issue. The implementer
makes it pass. A test that the implementer thinks is wrong is a dispute that the
tester settles.

**Why:** With one author, the test drifts to whatever the code does.
**When to change it:** Never in the workflow. In a session of your own, the rule
holds in spirit.

## Rulings instead of questions

The implementer decides an open question itself, after a `challenger` objects to the
ruling. The ruling goes into the pull request. Only a destructive action, a security
choice, or an effect outside the worktree stops the run for the user.

**Why:** Every question to the user stops the work. A challenged ruling is visible,
reversible, and has a known cost.
**When to change it:** The user often reverts rulings in review. Then the issues are
not clear enough. Fix `write-issue`, not the challenger.

## A review panel and a judge

Fresh, read-only reviewers read the pull request: the spec reviewer, the code
reviewer, and one reviewer per area of the project. The judge scores each finding from
0 to 100. Only findings at 70 or more go back to the implementer. Two review rounds per
increment.

**Why:** A reviewer that did not write the code sees what the author does not. The
judge removes the noise, so that the implementer does not fix false positives. The cap
stops an endless loop.
**When to change it:** Real defects reach the user below the threshold. Then lower it.

## One change after a merge

After each merge, the `retro` skill asks for each finding: would a fresh session make
the same mistake again? At most one change follows: a rule, a check line, a step, or
a check script.

**Why:** Lessons stay in the files that the next session reads. One change at a time
keeps the files small. Zero changes is the common result.
**When to change it:** The same finding comes back after a retro. Then the change was
in the wrong file.

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
