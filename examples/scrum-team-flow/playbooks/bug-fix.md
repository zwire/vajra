---
id: bug-fix
title: Bug fix
phase: any
lifecycle: any
kind: service
exits:
  - to: release-gate
    when: the fix is for a blocked release candidate and is merged
  - to: end
    when: the fix is merged to the default branch and verified
---

# Bug fix

## Purpose

Fix a defect at its root cause, with a regression test.

## Steps

1. Reproduce the defect and capture the failing evidence.
2. Find the root cause, not the first place it shows.
3. Write a failing test that captures the defect.
4. Fix the root cause with the smallest change.
5. Show the failing test passing and the suite green, then merge through a reviewed PR.

## Done when

- Before and after evidence exist, the regression test is merged, and CI is green.

## Reply with

- Root cause, fix, regression test, PR link.
