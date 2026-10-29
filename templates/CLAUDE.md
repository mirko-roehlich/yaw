# <project name>

<One sentence: what the product is, for whom, and the main stack.>

## Where to find what

- **`<docs/decisions/>`**: <the decisions, one section each with its rule and its why>.
- **`<docs/…>`**: <the glossary, the flows, the architecture>.
- **`.claude/rules/`**: how code is written here. Claude Code loads them by itself.
  Do not restate them elsewhere.
- **`.claude/yaw.json`**: the test paths and the setup command of a new worktree.

## Workflow

One skill per step, in `.claude/skills/`:

1. `write-issue`: the only writer of issues. Drafts first, creates them after your
   approval.
2. `build`: one issue from its number to a pull request with the label
   `ready-for-human`. The tester writes the red suite, the implementer makes it pass
   in its own worktree, the review panel judges, and the fix rounds follow. Without a
   number, it picks the next issue.
3. `retro`: after a merge, at most one change to a rule, a skill, or an agent.

You review and merge each pull request. The agents are in `.claude/agents/`.

Each artifact has one home. Do not copy it elsewhere:

| Artifact | Home |
| --- | --- |
| A decision | <a section of a file in `docs/decisions/`> |
| The spec of one increment | The GitHub issue, in the shape of `.github/ISSUE_TEMPLATE/issue.md` |
| Deviations and questions while building | Comments on that issue |
| Session state: behaviours, contract, rulings, handoff | `.work/plan.md` in the worktree, ignored by git |
| What a pull request did and why | The body of the pull request, in the shape of `.github/pull_request_template.md` |
| Review findings | A GitHub review on the pull request |
| The state of a build | The labels of the issue, and one `**build:**` comment per stop |

## Hard rules

1. **Where a document conflicts with a decision, the decision wins.** A decision
   changes in its own pull request, never inside the pull request of an issue.
2. **Do not restate the content of a decision in another document.** Link its section
   instead.
3. **All production code is test-driven.** No code without a failing test first. Every
   bug fix starts with a reproducer. The rule is `.claude/rules/tdd.md`.
4. <A hard rule of the project, one sentence.>
