---
id: bug-fix
title: Bug fix
phase: any
lifecycle: any
kind: service
exits:
  - to: ship
    when: the defect is in kept code and the fix is verified
  - to: end
    when: the defect was in throwaway code and is recorded
---

# Bug fix

## Purpose

Fix a defect at its root cause with proof.

## Steps

1. Reproduce the defect and capture the failing evidence.
2. Find the root cause (not the first place it shows).
3. Write a failing test that captures the defect when the lifecycle is `tracer` or `hardened`.
4. Fix the root cause with the smallest change.
5. Show the failing case now passing and the suite still green.

## Done when

- Before/after evidence and (for kept code) a regression test exist.
