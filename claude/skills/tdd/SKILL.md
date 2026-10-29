---
name: tdd
description: Red, green, refactor for exactly one behaviour. Pick the test level, run only that file, watch it fail for the right reason, make it pass, refactor, commit. The implement-issue skill uses it. Use it directly for a bug fix, with the reproducer first.
argument-hint: "<behaviour sentence>"
---

# One behaviour: $ARGUMENTS

The rules are in `.claude/rules/tdd.md`. This is the procedure. Read the rule once
per session, not once per behaviour.

## 1. Pick the level

The narrowest level that can express the behaviour.

<!-- Adoption fills this table with the test levels of the project. -->

| Level | What it tests | Where the test goes | Run one file |
| --- | --- | --- | --- |
| <unit> | <pure rules, invariants> | <beside the code> | `<command> <file>` |
| <integration> | <the database, a service> | <…> | `<command> <file>` |
| <end to end> | <a path through the running app> | <…> | `<command>` |

## 2. Red

In the workflow, the test exists already and belongs to the `tester`. Run only that
file. It must fail on an assertion. A compile error, a missing export, or an import
failure is the wrong reason: add the minimal export or type that the `## Contract` of
the plan names, run it again, and continue only when the failure is the assertion. A
wrong test is a dispute (`implement-issue`, step 6). Note the failing assertion in one
line.

Outside the workflow, for a bug fix in a session of your own, write the reproducer
yourself, through the public surface of the module. Then continue the same way.

## 3. Green

Write the minimum production code that passes. Do not make it general. Run the file
again.

## 4. Refactor, with the file still green

Apply the naming and comment rules of `.claude/rules/`. Remove duplication. Run the
file again.

## 5. Commit

One behaviour, one commit, as `.claude/rules/pr-workflow.md` says:
`<scope>: <imperative summary>`, with a body that says why. A refactor is its own
commit and never shares one with a behaviour.

## Hard stops

- No skipped or focused test in the tree.
- Production code before a red test: put it aside, watch the test fail without it,
  then bring it back. Never change the test to fit the code.
