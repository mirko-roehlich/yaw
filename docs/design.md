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
