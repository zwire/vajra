---
id: refactor
title: Refactor
phase: any
lifecycle: any
kind: service
exits:
  - to: end
    when: the refactor is merged with before and after evidence matching
---

# Refactor

## Purpose

Change structure without changing behavior.

## Steps

1. Pin current behavior with tests or characterization tests before changing anything.
2. Change structure in small commits, running `${test}` after each.
3. Confirm behavior is unchanged with the same evidence as step 1.
4. Merge through a reviewed PR.

## Done when

- Before and after evidence match and the PR is merged.

## Reply with

- What moved, the evidence, and the PR link.
