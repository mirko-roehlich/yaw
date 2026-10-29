---
name: open-pr
description: Bring the branch up to date, push it, open the pull request for an issue in the body shape of the repository, and watch CI. The implement-issue skill uses it. Use it directly when a branch is ready.
argument-hint: <issue-number>
---

# Open the pull request for #$0

## Preconditions

- The working tree is clean. Every commit follows `.claude/rules/pr-workflow.md`.
- The `gates` skill ran green on the current HEAD. If HEAD moved since then, run it
  again.

## Steps

1. `git fetch origin`. If the branch is behind `origin/main`, run
   `git rebase origin/main`. Resolve a conflict by hand. Then run the `gates` skill
   again before you push.
2. Post the Rulings of `.work/plan.md` on the issue before the pull request exists:
   `gh issue comment $0 --body-file <file>`, starting with `**build:** rulings`, one
   line per ruling as the plan words it (what · why · cost if wrong · challenged:
   verdict). The "Deviations, and why" of the pull request links that comment, so that
   a reviewer never needs the plan. No rulings, no comment.
3. `git push -u origin <branch>`. Never use `--no-verify`.
4. `gh pr create --title "<title>" --body-file <file>`:
   - **Title:** in the form of a commit message, `<scope>: <imperative summary>`.
   - **Body:** fill in the pull request template of the repository,
     `pull_request_template.md` in `.github/`, the root, or `docs/`, in any case.
     Follow the comment in each section, then remove the comments. Remove a section
     that does not apply. Tick a checkbox only when it is true.
   - "What changes" comes from the ticked behaviours of `.work/plan.md`. "Deviations,
     and why" comes from the Rulings, with a link to the comment of step 2.
   - **AI disclosure:** name Claude Code and your model. Write that no human has
     reviewed the change yet.
   - If the template has no place for the deviations or the AI disclosure, add a
     section for each at the end. The line `Fixes #$0` is always last.
5. `gh pr checks --watch`. A red check: fix it on the branch, commit, push, and watch
   again. Do not report done with a red check. If a check died within seconds, before
   any gate ran, the cause is the infrastructure, not the code. Report it as such and
   continue, because the `gates` skill ran green here.
6. Report the pull request URL and the results of the checks.

## Rules

- One pull request per issue. A second concern that you find on the way becomes a new
  issue (`gh issue create`), not a second commit here.
