# Plan

The session state of this worktree. Git ignores it. No reviewer reads it, and nobody
pastes it into a pull request. The "What changes" of the pull request comes from
Behaviours, its "Deviations" from Rulings.

## Issue

#<n> — <title> — <url>

## Behaviours

The ordered test sentences, narrowest level first. The tester writes them with the
red suite. The implementer ticks a line when its commit is green. The stop hook
refuses "done" while a line is open. If no behaviour can be a test, the one line is
`- none: <why>`.

- [ ] …

## Contract

The names that the tests import and the code does not export yet. The tester writes
them, one line each with the shape it assumed. The implementer provides them. A
disagreement is a dispute, not an edit.

- …

## Rulings

The decisions that the implementer took instead of asking, each after its challenge.
One line each: what · why · cost if wrong · challenged: verdict, the objection in a
few words. Ask the user only for a destructive action, a security choice, or an
effect outside this worktree.

- …

## Handoff

Pointers only. The `handoff` skill writes them: commits, issue comments, open
rulings, the next step. The stop hook lets a session end on these lines:

- `Awaiting: tests`: the tester's turn.
- `Dispute: <sentence> · <reason>`: the tester answers.
- `Challenge: <question> · <ruling> · <why>`: the challenger answers.
- `Blocked: <question>`, with a draft pull request: the user answers.

The `build` skill answers the first three and continues the session.

- …
