---
name: implement-issue
description: Implement one GitHub issue end to end in its own worktree. Read the spec, hand the worktree to the tester for the red suite, drive each behaviour through the tdd skill, run the gates, open the pull request. The implementer agent follows it.
argument-hint: <issue-number>
---

# Implement issue #$0

## Preconditions

Stop and report if one fails.

1. You are in a worktree, not in the main checkout: the folder of
   `git rev-parse --show-toplevel` is a sibling of `<project>/main`. In the main
   checkout: invoke the `worktree` skill to create one, tell the user to start a
   session there, and stop.
2. The working tree is clean. The branch is at `origin/main` or ahead of it
   (`git fetch`, `git status`).
3. Issue #$0 is open and has the five sections: Goal, Follows, Acceptance behaviours,
   Out of scope, Depends on. If a section is missing, comment on the issue with its
   name, then stop.
4. Every issue under "Depends on" is closed. If one is open, name it and stop.

## Steps

1. **Read before you write.** `gh issue view $0`, then each document under "Follows".
   This step prevents drift from the decisions.
2. **Name the branch** `issue/$0-<slug>`, with a slug of two to four words. The
   worktree hook names the branch after the folder. Rename it once:
   `git branch -m issue/$0-<slug>`. If the prompt names a branch to take over, run
   `git switch <branch>` instead, and copy `<main>/.work/$0/plan.md` over
   `.work/plan.md` if it exists. The branch keeps its name and its commits, and the
   prompt says where to continue.
3. **Hand the worktree to the tester.** Fill `## Issue` in `.work/plan.md` and write
   `- Awaiting: tests` under `## Handoff`. The `tester` agent writes the ordered
   behaviours and the contract names into the plan, and the red suite into the tree.
   It commits them as `tests:`. As the `implementer` agent, stop here with a one-line
   report: the worktree path. The `build` skill runs the tester and continues you. In
   a session of your own, start the `tester` agent with
   `Write the suite for #$0 in <worktree path>.` and wait. Never write a behaviour or a
   test yourself.
4. **Resume.** Remove the `Awaiting:` line. `git log` shows the `tests:` commit.
   `## Behaviours` and `## Contract` are filled. The behaviours are your only to-do
   list, in their order. If the one line is `- none: <why>`, do the work of the issue
   without the `tdd` skill, one commit per change, and go to step 8.
5. **One behaviour at a time.** For each sentence, invoke the `tdd` skill with the
   sentence. It runs the tester's test, watches it fail for the right reason, makes it
   pass, refactors, and commits. One behaviour, one commit. Tick the line when the
   commit is green. Never batch. A line that ends with `(guard)` is green already.
   Run its test, and tick the line without a commit.
6. **Disputes, not workarounds.** A test that cannot pass without breaking a rule, a
   decision, or another test, or that asserts something that the issue does not say,
   becomes `- Dispute: <sentence> · <reason>` under Handoff. Then stop. The build
   skill brings the tester's answer, `amended` or `refused`. Remove the line and
   continue. A refused dispute is a test to make pass. In a session of your own,
   continue the tester with the dispute instead of stopping.
7. **Rulings, challenged.** You decide a question that the issue, the documents, and
   the rules do not answer, after a challenge. Write
   `- Challenge: <question> · <intended ruling> · <why>` under Handoff and stop. The
   build skill brings the `challenger`'s verdict:
   - `settled`: follow the answer that it found.
   - `hold`: the ruling stands.
   - `reconsider`: take its alternative, or keep the ruling and say in the ruling why
     the objection does not hold.

   Then replace the line with a Rulings entry:
   `what · why · cost if wrong · challenged: <verdict>, <objection in a few words>`.
   In a session of your own, start the `challenger` agent instead of stopping. Ask the
   user only for a destructive action, a security choice, or an effect outside this
   worktree.
8. **Gates.** When every sentence is green, invoke the `gates` skill with what the
   change touches.
9. **Pull request.** Invoke the `open-pr` skill with `$0`. Its "What changes" is the
   ticked behaviours. Its "Deviations, and why" is the Rulings section.
10. **Handoff.** Invoke the `handoff` skill.
11. **Report** the pull request URL, the behaviours that you implemented, and each part
    of the issue that you did not build, with the reason. The worktree stays until the
    pull request is merged. The `worktree` skill removes it.

## Rules

- The issue is the scope. Do not build what is under "Out of scope" or outside the
  acceptance list. Write ideas under "Follow-ups" in the pull request instead.
- If the issue and a document under "Follows" disagree, the document wins. Comment on
  the issue with the conflict, and continue under the document.
- Never commit a test file. A `tests:` commit is the tester's.
- Never edit a decision document, and never use `--no-verify`.
- Blocked by a question that only the user can answer: finish everything that does not
  depend on it. Open the pull request as a draft (`gh pr create --draft`). Write the
  question in its body and as `- Blocked: <question>` under Handoff in
  `.work/plan.md`, and stop. The stop hook refuses every other early stop.
