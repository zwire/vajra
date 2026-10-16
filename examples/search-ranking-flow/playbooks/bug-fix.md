---
id: bug-fix
title: Bug fix
phase: any
lifecycle: any
kind: service
checks:
  - ${ranker-test}
  - ${serving-test}
exits:
  - to: shadow-validation
    when: the fix changes ranking or serving behavior
  - to: end
    when: the fix is merged and changes nothing users see
---

# Bug fix

## Purpose

Fix a ranking or serving defect at its root cause. If users are affected now, roll back first.

## Steps

1. If users are affected, run `${rollback} ${ab-experiment}` or `${serving-rollback}` (both reversible) and confirm on `${latency-board}`.
2. Reproduce the defect with a query and a captured request, and save them as a failing test.
3. Find the root cause, not the first place it shows.
4. Fix it with the smallest change and show the failing test passing.
5. Merge through a pull request with the reproduction linked.

## Done when

- Before and after evidence for the reproduced query, a regression test, and a merged pull request.

## Reply with

- Root cause, fix, regression test, PR link.
