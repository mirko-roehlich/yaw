---
name: gates
description: Run the checks of CI locally before a push. Which checks a change needs, and the exact commands. The implement-issue and open-pr skills use it. Use it directly before any push.
argument-hint: "[what the change touches]"
---

# Gates for: $ARGUMENTS

CI runs every gate below as a required check. Run locally what CI will run. A gate
that you skip is a red pull request an hour later.

<!-- Adoption fills both lists with the commands of the project. -->

## Always

```
<lint command>
<format check command>
<type check command>
<test command>
```

## When the change touches

- **<an area, for example the database schema>**: `<the command that this area needs>`

## Report

Each command with its result. A red gate: fix the cause and run the gate again. After
the second red run of the same gate, report it as red and stop.
