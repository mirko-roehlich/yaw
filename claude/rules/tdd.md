---
name: tdd
description: Test-driven work. Red, green, refactor; who writes the test; what gets no test; how to write a test.
---

# Test-driven work

Production code exists only to make a failing test pass.

## The loop

1. **Red:** write the smallest test that describes the next behaviour. Run it. Watch
   it fail, and fail for the right reason: an assertion, not a typo or a missing
   import.
2. **Green:** write the minimum code that passes. Do not make it general: no
   abstraction for one use, no option that the issue does not ask for, and no handling
   of a case that cannot occur.
3. **Refactor:** clean up with the tests green. Refactor only the code that this change
   touched or needs. Never mix a refactor into the step from red to green.

From this follows:

- No production code without a failing test first.
- A test that never failed proves nothing. The one exception is a guard: an acceptance
  behaviour that the code already has, and that no test covers yet. Its test is green
  from the start, and the `tests:` commit names it as a guard.
- **A bug fix starts with a reproducer:** the failing test that reproduces the bug
  through the public surface. The reproducer stays as the regression test.

## Who writes the test

In the workflow, the test and the code have different authors. The `tester` agent
writes every test from the behaviours of the issue, before the code exists. The
`implementer` makes the tests pass and cannot edit them. If the implementer thinks
that a test is wrong, that is a dispute. The tester settles it against the issue and
its documents, never against what is easier to build. With one author for both, the
test drifts to whatever the code does.

In a session of your own, the same holds: when a test does not pass, change the code
before you doubt the test.

## What gets no test

A test asserts behaviour that the project owns. These get no test:

- **Pure type declarations.** The first real user of the type tests it.
- **Vendor behaviour.** If the assertion still passes with all of the project's code
  deleted, delete the test instead.
- **Configuration values restated as expectations.**

## Writing tests

- **Test through the public surface** of a module, not its internals. If a behaviour
  cannot be reached from the public surface, question the behaviour.
- **Name a test as a plain statement of behaviour:** what the system does, not which
  function ran. "rejects an invitation that expired", not "validates the invitation".
- **Minimal setup:** only the data that triggers the behaviour.
- **One behaviour per test.** Assert outcomes, not internal calls.

## Done

- The new behaviour has a test that failed before the change and passes after it.
- The gates of the `gates` skill are green locally before the push.
- No skipped test. A test that silently stops running protects nothing. Fix it or
  delete it.
