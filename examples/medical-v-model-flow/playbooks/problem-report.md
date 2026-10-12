---
id: problem-report
title: Problem report
phase: any
lifecycle: any
kind: service
exits:
  - to: verify-against-spec
    when: the fix is merged and the trace matrix is updated
  - to: end
    when: the report is closed without a code change
---

# Problem report

## Purpose

Resolve a problem report at its root cause, with risk assessment and traceability.

## Steps

1. Record the report as `PR-n`, reproduce it, and capture the failing evidence.
2. Assess its risk class and the affected SRS items.
3. Find the root cause.
4. Write a failing test that captures it, then fix the root cause with the smallest change.
5. Show the test passing and the suites green; merge with two reviews.
6. Update `docs/trace.csv` and the report with the fix and evidence.

## Done when

- The report has risk class, root cause, fix, regression test and trace links, or is closed with a recorded reason.

## Reply with

- Risk class, root cause, fix, evidence.
