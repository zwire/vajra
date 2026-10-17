---
id: bug-fix
title: Bug fix
phase: any
lifecycle: any
kind: service
writes: [${code}]
exits:
  - to: sim-validation
    when: the fix touches perception, planning or motion
  - to: ship
    when: the fix touches nothing that moves the arm and its tests pass
---

# Bug fix

## Purpose

Fix a defect at its root cause, with proof from bags or simulation.

## Steps

1. Reproduce the defect on a recorded bag or in simulation, and capture the failing evidence.
2. Find the root cause, not the first place it shows.
3. Write a failing test that replays the defect.
4. Fix the root cause with the smallest change.
5. Show the failing case passing and `${test}` green.

## Done when

- Before and after evidence exist, plus a regression test.

## Reply with

- Root cause, fix, before and after evidence.
