# YAW - Your Agentic Workflow

A test-driven workflow for Claude Code. You tell the main session to build an issue.
It runs a tester, an implementer, and a review panel as subagents, and ends with a
pull request that waits for you. You see each agent while it works, and you answer
its questions in the chat.

## Why

YAW is for developers who want to hand an issue to Claude Code and come back to a
pull request they can trust.

The trust comes from separation. The agent that writes the tests does not write the
code, and the agents that review the code wrote neither. You keep the decisions that
matter: you write the issues, answer the questions that only you can answer, and
merge.

## Highlights

- **One instruction.** `/build 42`, or "build the next issue". The session picks the
  issue, runs every stage, and stops with one comment on the issue.
- **Tests first, by another author.** The tester writes the red suite. The implementer
  makes it pass and cannot edit it. A hook enforces this.
- **Fewer questions.** The implementer decides open questions itself, after a
  challenger objects. Each ruling goes into the pull request.
- **A review panel with a judge.** Fresh, read-only reviewers find defects. A judge
  scores each finding, and only the strong ones go back for a fix.
- **You merge.** No agent merges, approves, or pushes to `main`.
- **Files, not a runtime.** Agents, skills, rules, and four small hooks in `.claude/`.
  After the adoption, every file is yours.

## What's included

Adoption copies these from [`claude/`](claude/) into the `.claude/` folder of your
project:

- **Skills you call:** `write-issue` drafts and creates issues, `build` takes one issue
  to a pull request, and `retro` learns from a merged pull request.
- **Skills the agents use:** `implement-issue`, `tdd`, `gates`, `open-pr`,
  `review-pr`, `handoff`, `worktree`, and `simple-english` for the writing.
- **Agents:** seven agents, listed in [Agents](#agents).
- **Hooks:** they create and remove the worktrees, keep each agent in its own files,
  and refuse "done" while the work is open.
- **Rules:** test-driven work, the pull request workflow, and writing.
- **Settings:** an allow list for git and `gh`, behind a deny list for pushes to
  `main`, merges, and approvals.

[`templates/`](templates/) has the starting files for your `CLAUDE.md`, the issue and
pull request templates, a reviewer for one area, and `.claude/yaw.json`.

## Prerequisites

- A GitHub repository with the branch `main`, and `gh`, logged in.
- Claude Code.
- Node 22 or later, for the hooks. Your project does not need to use Node.
- Commands for your gates, for example lint, type check, and tests.

## Install

### 1. Set up the project folder

Each issue gets a worktree beside the main checkout. Keep them together in one folder
for the project. The agents get this folder and nothing else.

```
my-project/
├── main/                     the main checkout: you and the build skill work here
└── issue-42/                 the worktree of issue 42, created by a hook
```

For a new clone:

```sh
mkdir my-project
git clone <repository-url> my-project/main
```

For a repository on your machine:

```sh
mkdir my-project
mv <repository> my-project/main
git -C my-project/main worktree repair
```

### 2. Adopt YAW

Open Claude Code in the main checkout. Give it this instruction:

> Read `https://github.com/mirko-roehlich/yaw/blob/main/ADOPT.md` and adopt YAW into
> this repository.

It reads your repository first: the commands, the test paths, the rule files, and the
documents. Then it asks only what it cannot find. It shows the full plan before it
writes a file. It does not commit. You read the diff, commit, and push it to `main`.

### Remove YAW

Give Claude Code this instruction in the main checkout:

> Read `https://github.com/mirko-roehlich/yaw/blob/main/ADOPT.md` and remove YAW from
> this repository.

It shows what the adoption added and changed, and undoes it after you say yes. The
steps are in [Remove YAW](ADOPT.md#remove-yaw).

## Usage

1. **Write issues.** "Use write-issue for <your request>." It drafts the issues, asks
   for your approval, and creates them on GitHub.
2. **Build.** In the main checkout: `/build 42`, or "build the next issue".
3. **Answer.** When the run stops on a question, it says so in the chat and on the
   issue. Answer in the chat, and the same implementer continues.
4. **Merge.** When the issue has the label `ready-for-human`, review the pull request
   and merge it.
5. **Learn.** After the merge: `/retro <pr>`. It changes at most one rule, skill, or
   agent, and only if a fresh session would repeat the mistake.

## How a build runs

1. The implementer starts in a new worktree and hands it to the tester.
2. The tester writes the behaviours into `.work/plan.md` and commits the red suite.
3. The implementer makes one behaviour pass at a time, one commit each. A test that it
   thinks is wrong goes back to the tester as a dispute. An open question goes to the
   challenger.
4. The implementer runs the gates and opens the pull request.
5. The review panel reviews it, and the judge scores the findings. Strong findings go
   to the tester for a reproducer and to the implementer for a fix. At most two
   rounds.
6. The issue gets `ready-for-human`, with one comment that sums up the run.

## Agents

| Agent | What it does |
| --- | --- |
| [tester](claude/agents/tester.md) | Writes the behaviours and the red suite. Owns the test files. |
| [implementer](claude/agents/implementer.md) | Makes the tests pass in its own worktree, and opens the pull request. |
| [challenger](claude/agents/challenger.md) | Objects to a ruling of the implementer before it stands. |
| [reviewer-spec](claude/agents/reviewer-spec.md) | Checks scope and test evidence against the issue. |
| [reviewer-code](claude/agents/reviewer-code.md) | Checks correctness and the rules of the repository. |
| [judge](claude/agents/judge.md) | Scores each review finding from 0 to 100. |
| [scout](claude/agents/scout.md) | Finds the files and documents that bind a topic. |

Adoption adds one reviewer per area of your project, for example security, from
[`templates/reviewer-area.md`](templates/reviewer-area.md).

## Configuration

| To change | Edit |
| --- | --- |
| The test paths and the setup of a new worktree | `.claude/yaw.json` |
| The gates | `.claude/skills/gates/SKILL.md` |
| The test levels | `.claude/skills/tdd/SKILL.md` |
| How code is written | A file in `.claude/rules/` |
| The size of an issue | `.claude/skills/write-issue/SKILL.md` |
| A reviewer area | A `reviewer-<area>.md` in `.claude/agents/` |
| What the agents may run | `.claude/settings.json` |

## Limitations

- **Claude Code only.** There is no layer for other coding agents.
- **GitHub only.** The state of a build lives in labels, comments, and pull requests.
- **One issue per run.** To build several issues at once, open one session per issue.
- **Token use.** A build runs several agents, and each review round runs the panel
  again. Expect more tokens than one agent that works alone.
- **Issues you can describe up front.** For exploratory work, where you learn what you
  want while you build it, work with Claude Code directly.

## Design

The decisions behind YAW, each with its reason and when to change it, are in
[`docs/design.md`](docs/design.md).

## Development

The hooks have tests: `node --test tests/`.

Found a problem or have an idea? Open an
[issue](https://github.com/mirko-roehlich/yaw/issues).

## License

MIT. See `LICENSE`. The `simple-english` skill keeps its own MIT license in
`claude/skills/simple-english/LICENSE`.
