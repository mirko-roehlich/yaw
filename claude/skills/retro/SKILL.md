---
name: retro
description: After a pull request merged, decide whether one rule, skill, or agent should change, so that a fresh session would not repeat what the review found. At most one change, checked against a counterfactual, delivered as its own pull request. Otherwise "nothing to change". Use after each merge of an issue.
argument-hint: <pr-number>
---

# Retro for #$0

## Gather

`gh pr view $0 --json body,mergedAt`, the reviews on it
(`gh api repos/{owner}/{repo}/pulls/$0/reviews` and `…/comments`), the issue that it
fixed, and the rulings under "Deviations, and why" in its body.

## Decide

For each finding that the panel posted, and for each deviation, ask: **would a fresh
session that follows the current rules, skills, and agents make the same mistake
again?** Only a "yes" is a lesson. Of the lessons, pick the one with the highest cost
if it repeats. Zero lessons is the common and correct result.

## Deliver

- **Nothing:** report "nothing to change", with each finding that you dismissed and
  why, one line each.
- **One lesson:** the smallest change to the one file that would have prevented it: a
  rule in `.claude/rules/`, a check line in a reviewer agent, a step in a skill, or a
  check script that CI runs. Never a new lessons file, never a comment in code. Create
  a worktree with the `worktree` skill (`retro-<pr>`), commit
  `tooling: <what the lesson prevents>`, and open the pull request as the `open-pr`
  skill says, without the issue steps and without `Fixes`. Its "Why" names the finding
  and the counterfactual.

Report the pull request URL or "nothing to change".
