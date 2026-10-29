---
name: review-pr
description: Review a pull request with the reviewer panel, score the findings with the judge, and post the result as a GitHub review. The build skill uses it. Run it from the main checkout before you ask the user to merge.
argument-hint: <pr-number>
---

# Review pull request #$0

You coordinate. Fresh, read-only agents that never saw how the diff was written do the
reading. The judge decides what is worth posting.

## Preconditions

- `git rev-parse --show-toplevel` is the main checkout. Otherwise stop.
- `gh pr view $0 --json state,author,isDraft,headRefName,body`: the state is `OPEN`.
  If a bot opened it, for example for dependency updates, say so in one line and stop.
- The round number is one more than the reviews that this skill posted already:
  `gh api repos/{owner}/{repo}/pulls/$0/reviews --jq '[.[] | select(.body | startswith("## Review round"))] | length'`.
  Count only the rounds after the last `**build:** ready for human` comment on the
  issue (`gh api repos/{owner}/{repo}/issues/<n>/comments`, with the issue from
  `Fixes #…` in the body). Without such a comment, count every round. Two rounds per
  increment: when both are used, report what stays open and stop. A revision by the
  user after that comment is a new increment with two rounds of its own.

## Steps

1. **Gather once.** The issue number from `Fixes #…` in the body.
   `mkdir -p .work/review/$0`.
2. **Panel.** Start every reviewer agent in parallel: `reviewer-spec`,
   `reviewer-code`, and each other `reviewer-*` agent in `.claude/agents/`. Give each
   the prompt `Review pull request #$0 (round <r>). Issue #<n>.` Wait for all of them.
3. **Collect.** Write the fenced JSON block of each agent to
   `.work/review/$0/<agent>.json` with the Write tool. Add `"reviewer": "<agent>"` to
   every object. Merge the arrays into `.work/review/$0/findings.json`. An agent that
   returned no block counts as an empty array. Note it in the report.
4. **Judge.** Start the `judge` agent with
   `Pull request #$0. Issue #<n>. Findings: .work/review/$0/findings.json`. Write its block to
   `.work/review/$0/judged.json` with the Write tool.
5. **Post.**
   `node .claude/skills/review-pr/post-review.mjs $0 --threshold 70 --round <r>`. The
   script posts a `COMMENT` review: one inline comment per finding at or above the
   threshold, the rest of those in the body, and two collapsed lists: the findings on
   code comments, and the findings between 50 and the threshold for the author's
   judgement. Nothing else below the threshold.
6. **Report** in this order: the review URL, the count above the threshold by
   severity, the count below, and each agent that returned nothing. Nothing else.

## Rules

- Never approve and never request changes. Never edit a file outside `.work/`.
- Findings above the threshold go back to the implementer through the caller: the
  `build` skill or the user. This skill fixes nothing.
- Zero findings is a valid result. Post it as such.
