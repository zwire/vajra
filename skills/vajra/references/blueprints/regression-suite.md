---
id: regression-suite
title: Regression suite
phase: any
lifecycle: any
kind: service
exits:
  - to: end
    when: the suite is green in CI
---

# Regression suite

## Purpose

Keep a suite that proves known behavior and fixed defects stay fixed.

## Steps

1. Add a test for each newly fixed defect and each critical user path.
2. Remove or fix flaky tests at the root cause; never skip them.
3. Run the suite in CI on every change.

## Done when

- The suite is green in CI and covers every listed critical path.
