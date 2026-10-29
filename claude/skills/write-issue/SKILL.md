---
name: write-issue
description: The only writer of issues. Turns a request, a document, or an issue that is too large into issues that fit the size budget, ordered by dependency. Drafts first, creates them after the user approves. Use before any implementation starts.
argument-hint: "<request | issue-number | document path>"
---

# Write issues for: $ARGUMENTS

## The budget of one issue

- One goal that the user can see when the issue is merged.
- At most <8> acceptance behaviours. Each one is a test sentence through the public
  surface.
- The change fits in one pull request of at most <500> changed lines, without
  generated files.

An issue that needs more is two issues.

## Steps

1. **Read.** The source: the request, the issue, or the document sections. Read the
   glossary and the flows that it touches, and `.github/ISSUE_TEMPLATE/issue.md`.
2. **Scout.** Start the `scout` agent with the topic. Read what it names, so that the
   issues build on what exists and do not specify covered behaviour again.
3. **Draft** each issue to `.work/issues/<k>.md` in the shape of the template: Goal,
   Follows, Acceptance behaviours, Out of scope, Depends on. The title says what the
   user can do afterwards. Order the issues by dependency. An issue depends only on
   earlier ones. When you split an issue, the first part is the smallest increment
   that the user can see, not the data model alone.
4. **Approval.** Show the user: the titles, the count of behaviours, and the
   dependency order. Show the open questions in one list. Wait for the approval.
   Apply the edits.
5. **Create.** `gh issue create --title … --body-file …` for each issue, in order. Fill
   "Depends on" with the real numbers. A split source issue becomes the tracking
   issue: its body becomes the list of the new issues, and it gets the label
   `tracking`. It closes when the last of them merges.
6. **Report** the issue numbers in order.

## Rules

- A behaviour is a test sentence: what the system does, with an input and an outcome
  that a test can check. "Works correctly" is not a behaviour.
- No approach, no design, no file names of the solution. The implementer decides the
  approach.
- Do not restate a document in an issue. Link its section under "Follows" instead.
