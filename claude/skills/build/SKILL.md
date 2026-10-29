---
name: build
description: The one instruction of the workflow. Drives one GitHub issue from its number to a pull request that waits for the user, through the tester, the implementer, the review panel, and the fix rounds. Without a number, it picks the next issue. Use when the user asks to build an issue or to start the next one. Run from the main checkout.
argument-hint: "[issue-number]"
---

# Build $ARGUMENTS

You coordinate from the main checkout. You never design, implement, test, or review
yourself:

- a `tester` agent writes the red suite,
- an `implementer` agent builds in its own worktree,
- a `challenger` agent objects to its rulings,
- the `review-pr` skill judges the pull request.

You read the labels, run the stage that they call for, relay between the agents, move
the labels, and leave exactly one comment on the issue when you stop. Every comment
that you write starts with `**build:**`. That is how the next run tells your comments
from the user's. Where a step says **Stop**, your final message is that comment, word
for word and once: nothing before it, nothing after it.

In this file, `<n>` is the issue number.

## Pick the issue

With a number, `<n>` is that number. Without one, pick the next issue:

1. `gh issue list --state open --limit 200 --json number,title,labels,body`.
2. Skip each issue with one of the labels `tracking`, `in-progress`, `in-review`,
   `blocked`, or `ready-for-human`. Skip each issue without the five sections of the
   template: Goal, Follows, Acceptance behaviours, Out of scope, Depends on. Skip each
   issue with an open issue under "Depends on".
3. Take the lowest number that is left. Tell the user its number and title in one
   line, then continue. If none is left, say "No issue is ready" and stop.

## Preconditions

Stop and report if one fails. Change nothing.

- `git rev-parse --show-toplevel` is the main checkout. After `git fetch origin`,
  `git status --porcelain` is empty and `git rev-list --count origin/main..HEAD` is 0.
- `gh issue view <n> --json state,title,labels,body`: open, no `tracking` label, the
  five sections present, every issue under "Depends on" closed.

## Where the issue stands

Check in this order. The first match decides.

1. `ready-for-human`: stop. The pull request in your last comment waits for the user.
   To ask for a revision, the user comments on the pull request, removes the label,
   and starts a build again.
2. `blocked`, and the user has not answered after your last comment: stop. Your last
   comment says what the user decides.
3. An open pull request whose body has `Fixes #<n>`
   (`gh pr list --search "Fixes #<n> in:body" --json number,isDraft,url,headRefName`):
   - A draft, and the user answered on the issue after your last comment: remove
     `blocked`. **Take over** its branch, with the last clause
     `The user's answer: <their text>. Resume implement-issue where the Blocked line in .work/plan.md left it.`
     Then **Implement**, step 4, from the first match on.
   - A draft without an answer: **Stop** `needs-decision`, with the `Blocked:`
     question from its body.
   - Not a draft: make sure `in-review` is on, then go to **Review**.
4. `in-progress` or `in-review` without a pull request: stop. Another run holds the
   issue, or a run died and left the labels. The user checks `git worktree list` for a
   worktree with commits of this issue, then removes the labels.
5. Otherwise: **Implement**.

## Implement

1. Add `in-progress`.
2. Start the `implementer` agent with `Invoke the implement-issue skill for #<n>.` and
   wait. The WorktreeCreate hook creates its worktree beside the main checkout. Never
   open that worktree yourself. Its first report is the worktree path: it stopped on
   `Awaiting: tests`.
3. Start the `tester` agent with `Write the suite for #<n> in <worktree path>.` and
   wait for its report: the behaviours, the contract names, and how each file fails.
4. Continue the implementer with `SendMessage`. Its worktree and its context are
   intact: `Tests are in. <tester report> Resume implement-issue at step 4.` Wait. Then,
   on each report, the first match decides:
   - `Dispute:` lines: continue the tester with
     `Disputes on #<n>: <the lines>. Amend or refuse each.` Wait. Continue the
     implementer with the tester's report. Wait. Back to this list.
   - `Challenge:` lines: start a new `challenger` for each line with
     `Worktree <path>, issue #<n>. Question: <…> Intended ruling: <…> Because: <…>`.
     Wait. Continue the implementer with the verdicts. Wait. Back to this list.
   - The seventh relay in one run: **Stop** `needs-decision`, with the last lines.
   - Otherwise, read `gh pr list --search "Fixes #<n> in:body" --json number,isDraft,url`:
     - An open pull request, not a draft: replace `in-progress` with `in-review`. Go
       to **Review**.
     - A draft: **Stop** `needs-decision` with the `Blocked:` question from its body.
       If the report says that a gate stayed red, **Stop** `gates-red` instead.
     - No pull request: **Stop** `no-pr`, with the last lines of the report and the
       worktree path from `git worktree list`.

## When the user answers in the chat

You stopped on `needs-decision`, and the implementer of this run still waits on its
`Blocked:` line. When the user answers in this session:

1. Add the answer to the issue as a comment that quotes the user.
2. Remove `blocked`.
3. Continue the same implementer with
   `The user's answer: <their text>. Resume implement-issue where the Blocked line in .work/plan.md left it.`
   Then go on with **Implement**, step 4, from the first match on.

## Review

1. Invoke the `review-pr` skill with the pull request number. Read its report: the
   review URL and the count of findings at or above the threshold. It refuses a third
   round. That answer means that the rounds are used up: go to step 4.
2. Findings: first continue the `tester` with
   `Review round <r> on pull request #<p>: <review url>. For each finding at or above confidence 70: a defect gets its reproducer, a missing or weak test gets the test, red and committed as tests:. A finding that needs no test gets "no test needed". One that you cannot reproduce gets "not reproducible" and why. Report each finding.`
   Wait. Then continue the `implementer` with
   `Review round <r> on pull request #<p>: <review url>. Tester: <its report>. For each finding at or above confidence 70: fix it on your branch, one commit per finding, the tester's red test first where there is one. Or answer it in a comment on the pull request, with the reason why it is wrong. A fix that adds a behaviour outside the issue is a deviation. Add it to "Deviations, and why" in the body of the pull request, with a link to its issue comment. Push, run the gates skill, and report what you fixed and what you answered, each answer with its reason.`
   Wait. A report without a push: **Stop** `fix-round-failed`.
   - If this run started no tester and no implementer (the pull request was open
     already), **Take over** the branch first, with the last clause
     `Stop with your worktree path. The findings of the review follow.` Prefix the
     message to the new tester with `Read .work/plan.md in <the implementer's worktree path> first.`
     These two agents get every later round.
   - A dispute in a report is one more pair of continuations. The seventh pair:
     **Stop** `needs-decision`.
3. Back to step 1 for round 2. Findings after round 2 get one more fix round, which the
   panel does not see. The comment names them.
4. Replace `in-review` with `ready-for-human`. Comment `**build:** ready for human`.
   That line comes first and word for word, because `review-pr` counts its rounds from
   it. Then:
   - the pull request URL,
   - for each round: the review URL, the count above the threshold, fixed, answered,
   - each finding that was answered instead of fixed, one line each:
     `file:line · the claim · the implementer's reason`,
   - the findings fixed after the last round,
   - the rulings under "Deviations, and why" of the pull request: the count, the
     first words, and the challenger's verdict of each.

   Stop.

## Take over

Fresh agents continue a branch whose agents ended with an earlier run. An agent lives
exactly as long as the run that started it. The new implementer's worktree is the one
that its hook creates, so the branch moves there.

1. Find the worktree of the branch: the `branch refs/heads/<branch>` entry of
   `git worktree list --porcelain`. If there is none and the branch is on `origin`,
   go to step 3 without a plan. Otherwise, without a worktree: **Stop** `no-pr`, and
   name the branch.
2. Free the branch and keep the session state:
   `git -C <old worktree> switch --detach`, then
   `mkdir -p <main>/.work/<n> && cp <old worktree>/.work/plan.md <main>/.work/<n>/plan.md`.
3. Start the `implementer` agent with
   `Invoke the implement-issue skill for #<n> on branch <branch>: in your worktree, run git switch <branch>, copy <main>/.work/<n>/plan.md over .work/plan.md if it exists, then <the last clause of the caller>.`
   Wait for its report: the worktree path.
4. `git worktree remove <old worktree>`. Git refuses a worktree with untracked files.
   Then it stays, and the comment that you stop on names it for the user to remove.

## Stop

An early stop adds `blocked` and leaves `in-progress` or `in-review` where they are.
Then the next run sees that a worktree can hold work. Write one comment,
`**build:** stopped — <reason>`, with what the user does next. When an implementer ran
in this run and its branch is not pushed, add `Branch: <branch> · <worktree path>`.

Reasons:

- `needs-decision`: the implementer stopped on a question, or on a conflict that it
  could not decide. Next: answer in the chat while this session runs, or answer in a
  comment on the issue and start a build again.
- `gates-red`: a gate stayed red after the implementer's second attempt.
- `no-pr`: the implementer ended without a pull request, or the worktree of the branch
  is gone. A worktree keeps its commits.
- `fix-round-failed`: a fix round ended without a push.

## Never

- Commit on `main`, or push the branch yourself.
- Open a worktree that you did not start.
- Start a second implementer or a second tester for the same issue while the first
  still lives in this run.
- Run a tester and an implementer at the same time in one worktree.
- Build two issues in one run.
- Start an agent in the background. Start every agent with the Agent tool and wait,
  so that the user sees it work. It ends with your run.
