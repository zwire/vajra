---
id: refactor
title: Refactor
phase: any
lifecycle: any
kind: service
exits:
  - to: ship
    when: before and after evidence match
  - to: end
    when: the refactor was abandoned and reverted
---

# Refactor

## Purpose

Change structure without changing behavior.

## Steps

1. Record current behavior (tests or characterization tests) before changing anything.
2. Change structure in small steps, running tests after each.
3. Confirm behavior is unchanged with the same evidence as step 1.

## Done when

- Before and after evidence match.
