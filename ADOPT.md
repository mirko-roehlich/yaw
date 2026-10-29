# Adopt YAW

This file is for Claude Code. The human gives it one instruction:

> Read `https://github.com/mirko-roehlich/yaw/blob/main/ADOPT.md` and adopt YAW into this repository.

Follow this file in the main checkout of the project. YAW is a baseline. After the
adoption, every file belongs to the project, and the project shapes it freely. There
are no updates from YAW. Adoption does not copy this file into the project.

## Rules for this procedure

1. Write nothing into the project before the human accepts the plan in step 4.
2. Ask one question at a time. Give your recommended answer with each question.
3. Do not ask for a fact that the repository shows. Show what you found. Then ask the
   human whether it is correct.
4. Do not do a public action without a clear yes from the human. Public actions are a
   push, a pull request, and a label or an issue on GitHub.
5. Do not overwrite an existing file. Merge your content into it and show the result
   in the plan.
6. Do not commit. The human reads the diff and commits.
7. Do not work against what exists. If an existing file, hook, or setting affects
   YAW, show it and ask the human. YAW does not cover every setup.

## 1. Get YAW

Clone YAW into a temporary folder outside the project:
`git clone https://github.com/mirko-roehlich/yaw.git <tmp>/yaw`.

## 2. Check the prerequisites

| Item | Check |
| --- | --- |
| A git repository with the branch `main` | `git branch --list main` prints `main`. |
| A clean working tree | `git status --porcelain` prints nothing. |
| GitHub | `git remote get-url origin` names `github.com`, and `gh auth status` succeeds. |
| Node 22 or later | `node --version` |
| Claude Code | `claude --version` |

If an item is missing, tell the human what to install or change. Then stop.

Then check the layout. The main checkout must be `<project>/main`, in a folder that
holds only this project. The settings give every agent the folder above the main
checkout, and the worktrees go into it. If the layout is different, give the human the
commands, and stop until the human ran them:

```sh
mkdir <project>
mv <repository> <project>/main
git -C <project>/main worktree repair
```

Then continue in `<project>/main`. Do not move the repository yourself.

## 3. Find the facts, then ask

### Find

1. **The commands.** Look in `package.json`, `Makefile`, `justfile`, `Cargo.toml`,
   `pyproject.toml`, and the CI configuration:
   - the setup of a new worktree, for example the install command,
   - each gate that CI runs: lint, format check, type check, tests, end-to-end tests,
     and the gates that only some areas need,
   - each test level, the command that runs one file, and where its tests go.
2. **The test paths:** the globs of the test files, fixtures, test helpers, and
   snapshots. The hook checks whole files. If the project has tests inside production
   files, for example `#[cfg(test)]` modules in Rust, point it out.
3. **The ignored files that a worktree needs,** for example `.env`. A worktree does not
   get them by itself. The setup command can copy them, for example
   `cp ../main/.env .env && pnpm install`.
4. **The rule files of agents and coding tools:** `CLAUDE.md` and `AGENTS.md` in every
   folder, `.claude/agents/`, `.claude/skills/`, `.claude/rules/`,
   `.claude/settings.json` with its hooks and deny rules, `.cursor/rules/`,
   `.github/copilot-instructions.md`, and `GEMINI.md`. For each file, note what it
   says about code, and what it says about how to work: commits, pushes, pull
   requests, the order of steps.
5. **The contradictions.** For each sentence of step 4 about how to work, check it
   against the skills of YAW. A sentence is blocking if it forbids what the workflow
   needs. Examples: "never commit without the human", a hook that formats the whole
   project, a deny rule on `git commit`.
6. **The name clashes:** each file in `.claude/agents/`, `.claude/skills/`, and
   `.claude/rules/` with the name of a YAW file.
7. **The documents** that bind the work: decisions, a glossary, flows, the
   architecture. They go into "Where to find what" of `CLAUDE.md`, and an issue
   follows them.
8. **The areas** that need their own reviewer, for example security, data, or the user
   interface. Take them from the stack and the existing rules.
9. **One sentence** on what the product is, for whom, and the main stack. Take it from
   the README.
10. **The labels** on GitHub: `gh label list`.
11. **The pull request template:** `pull_request_template.md` in `.github/`, the root,
    or `docs/`, in any case, and the folder `.github/PULL_REQUEST_TEMPLATE/`.

### Ask

If step 5 of "Find" found a blocking sentence, ask about it first. Explain that the
workflow cannot run while it applies. The human changes it, limits it to work outside
YAW, or stops the adoption. If the human stops it, write nothing.

Ask these questions in this order:

| # | Question | Recommendation | Where the answer goes |
| --- | --- | --- | --- |
| 1 | Are the setup, the gates, and the test levels that you found correct and complete? | What you found. | `setup` in `.claude/yaw.json`, the `gates` and `tdd` skills, the allow list. |
| 2 | Are the test paths correct? | What you found. | `testPaths` in `.claude/yaw.json`. |
| 3 | Keep the budget of one issue: at most 8 behaviours and 500 changed lines? | Yes. | The `write-issue` skill, the issue template. |
| 4 | Which areas get their own reviewer, and which rule file or document does each one check? | Your proposal from step 8. | `.claude/agents/reviewer-<area>.md`. |
| 5 | Show each rule file of step 4 with its proposed home. For each one: a rule in `.claude/rules/`, a pointer to it from a rule, or no change? | A rule that points to the file. | `.claude/rules/`. |
| 6 | Show each contradiction of step 5. For each one: keep it, or change the source? | Keep it, and show where it wins. | Only on "change": the source. |
| 7 | Show each name clash of step 6. For each one: keep the existing file and add the YAW file as `yaw-<name>`, or replace it? | Keep it, and add the YAW file as `yaw-<name>`. | Step 5. |
| 8 | Is the product sentence correct? Which hard rule of the project goes into `CLAUDE.md`? | Your proposal from the README. | `CLAUDE.md`. |
| 9 | Create the labels that are missing: `in-progress`, `in-review`, `blocked`, `ready-for-human`, `tracking`? | Yes. | Step 5, "Labels". |
| 10 | Only if step 11 of "Find" found a template: keep it, replace it with the YAW template, or add the sections of the YAW template to it? | Add the sections. | The existing template. |

## 4. Show the plan

Show the human one list before you write anything:

1. Each answer.
2. Each file that you create, with its source.
3. Each existing file that you change, with the change as a diff.
4. Each public action, with its command.
5. Each contradiction, with the decision of the human.

Continue only after the human says yes. If the human changes an answer, show the plan
again.

## 5. Write the files

`<tmp>/yaw` is the clone from step 1. Copy without overwriting: `cp -Rpn`.

| Project path | Source | How |
| --- | --- | --- |
| `.claude/agents/` | `claude/agents/` | Copy. |
| `.claude/agents/reviewer-<area>.md` | `templates/reviewer-area.md` | One copy per area from question 4. Fill in the name, the area, the rule file, and the checks. Remove the comment. |
| `.claude/skills/` | `claude/skills/` | Copy. Fill in the `gates` skill and the table of the `tdd` skill from question 1, and the budget of the `write-issue` skill from question 3. |
| `.claude/rules/` | `claude/rules/` | Copy. Add the rules and pointers from question 5. |
| `.claude/hooks/` | `claude/hooks/` | Copy with `-p`. |
| `.claude/settings.json` | `claude/settings.json` | Merge the allow list, the deny list, `additionalDirectories`, and the hooks into the existing file. Add each command of question 1 to the allow list: `Bash(<command>*)`. |
| `.claude/yaw.json` | `templates/yaw.json` | Fill in `testPaths` from question 2 and `setup` from question 1. |
| `.claude/LICENSE` | `LICENSE` | Copy. The MIT license requires it in every copy. |
| `CLAUDE.md` | `templates/CLAUDE.md` | Fill in. If the file exists, keep its content and add the sections that are missing. If `AGENTS.md` holds the instructions, keep it and make `CLAUDE.md` point to it with `@AGENTS.md`. |
| `.github/ISSUE_TEMPLATE/issue.md` | `templates/issue.md` | Fill in the budget from question 3. |
| `.github/pull_request_template.md` | `templates/pull-request.md` | Copy if no template exists. Otherwise, do what question 10 says. |
| `.gitignore` | None. | Add `.work/` if it is missing. |

For each "add as `yaw-<name>`" in question 7: copy the YAW file with the prefix, set
its `name` to `yaw-<name>`, and replace the name in the copied YAW files.

### Labels

After a yes to question 9, create each missing label:
`gh label create <name> --description "<what it means>"`.

## 6. Check the result

1. `node --check` succeeds for each file in `.claude/hooks/` and for
   `.claude/skills/review-pr/post-review.mjs`.
2. The test-path hook refuses a test file and allows a code file:
   `echo '{"cwd":"<main>","tool_input":{"file_path":"<main>/<a test path>"}}' | node .claude/hooks/test-paths.mjs --deny`
   prints `"deny"`. The same with a production file prints nothing.
3. The worktree hook works:
   `echo '{"name":"yaw-check","cwd":"<main>"}' | node .claude/hooks/worktree-create.mjs`
   prints `<project>/yaw-check`, and the setup ran there. Then remove it:
   `git worktree remove ../yaw-check` and `git branch -D yaw-check`.

Then delete `<tmp>/yaw`.

## 7. Hand over

Tell the human:

1. Read the diff with `git status` and `git diff`. Commit it and push it to `main`.
   Each worktree starts from `origin/main`, so the agents and the hooks must be there
   before the first build.
2. Start `claude` once in the main checkout and accept the prompt that trusts the
   folder. Until then, Claude Code ignores the allow list and `additionalDirectories`
   of `.claude/settings.json`.
3. Write the first issue: "Use write-issue for <the request>".
4. Start a build in the main checkout: `claude`, then `/build <n>`, or "build the next
   issue". You see each agent in the transcript while it works. When the run stops on
   a question, answer it in the chat.
5. After a merge: `/retro <pr>`, then `/worktree remove <name>`.
6. Every agent uses the permissions of the session. These include the personal
   settings of the machine, for example in `~/.claude/`.
7. YAW does not cover every setup. If an agent acts against an existing instruction,
   hook, or setting, change the project files. Every file belongs to the project.

## Remove YAW

The human can ask you to remove YAW later. Then follow these steps.

1. Find the commit of the adoption in the git history. Show the plan: each file that
   the adoption created, and each change in a file that existed before.
2. After the human says yes, delete the files and undo the changes.
3. List the worktrees beside the main checkout. Do not remove them. The human decides.
4. The labels stay on GitHub unless the human asks to delete them.
